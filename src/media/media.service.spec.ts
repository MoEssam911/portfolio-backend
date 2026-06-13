import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

import { PrismaService } from 'src/prisma/prisma.service';
import { MediaService } from './media.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

const uploadStreamMock = cloudinary.uploader.upload_stream as jest.Mock;
const destroyMock = cloudinary.uploader.destroy as jest.Mock;

const STORAGE = {
  'storage.cloudName': 'demo-cloud',
  'storage.apiKey': 'demo-key',
  'storage.apiSecret': 'demo-secret',
  'storage.folder': 'portfolio/test',
} as const;

const buildFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    buffer: Buffer.from('file-bytes'),
    size: 1024,
    mimetype: 'image/png',
    originalname: 'avatar.png',
    ...overrides,
  }) as Express.Multer.File;

describe('MediaService', () => {
  let service: MediaService;
  let prisma: {
    media: {
      create: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      media: {
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: keyof typeof STORAGE) => STORAGE[key],
          },
        },
      ],
    }).compile();

    service = module.get(MediaService);
  });

  it('configures the Cloudinary SDK from storage config', () => {
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'demo-cloud',
      api_key: 'demo-key',
      api_secret: 'demo-secret',
    });
  });

  describe('uploadFile', () => {
    it('streams the buffer and persists public_id/secure_url', async () => {
      uploadStreamMock.mockImplementation(
        (_opts: unknown, cb: (err: unknown, res: unknown) => void) => ({
          end: () =>
            cb(null, {
              public_id: 'portfolio/test/u1/avatar_abc',
              secure_url: 'https://res.cloudinary.com/demo/avatar.png',
            }),
        }),
      );

      prisma.media.create.mockImplementation((args: { data: object }) => ({
        id: 'm1',
        ...args.data,
      }));

      const file = buildFile();
      const result = await service.uploadFile('u1', file);

      expect(uploadStreamMock).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'portfolio/test/u1',
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        }),
        expect.any(Function),
      );

      const [createArg] = prisma.media.create.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(createArg.data).toMatchObject({
        userId: 'u1',
        key: 'portfolio/test/u1/avatar_abc',
        url: 'https://res.cloudinary.com/demo/avatar.png',
        type: 'IMAGE',
      });
      expect(result.key).toBe('portfolio/test/u1/avatar_abc');
    });

    it('rejects unsupported file types before uploading', async () => {
      await expect(
        service.uploadFile('u1', buildFile({ mimetype: 'text/plain' })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(uploadStreamMock).not.toHaveBeenCalled();
    });

    it('wraps Cloudinary upload errors in BadRequestException', async () => {
      uploadStreamMock.mockImplementation(
        (_opts: unknown, cb: (err: unknown) => void) => ({
          end: () => cb(new Error('boom')),
        }),
      );

      await expect(
        service.uploadFile('u1', buildFile()),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.media.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteMedia', () => {
    it('destroys the asset using the image resource_type and deletes the row', async () => {
      prisma.media.findFirst.mockResolvedValue({
        id: 'm1',
        key: 'portfolio/test/u1/doc_xyz',
        mimeType: 'application/pdf',
      });
      destroyMock.mockResolvedValue({ result: 'ok' });
      prisma.media.delete.mockResolvedValue({});

      const res = await service.deleteMedia('u1', 'm1');

      expect(destroyMock).toHaveBeenCalledWith('portfolio/test/u1/doc_xyz', {
        resource_type: 'image',
        invalidate: true,
      });
      expect(prisma.media.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
      expect(res).toEqual({ success: true });
    });

    it('throws NotFound when the media does not exist', async () => {
      prisma.media.findFirst.mockResolvedValue(null);

      await expect(service.deleteMedia('u1', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(destroyMock).not.toHaveBeenCalled();
    });
  });
});
