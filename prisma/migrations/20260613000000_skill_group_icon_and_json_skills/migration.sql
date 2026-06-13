-- Add icon column to SkillGroup
ALTER TABLE "SkillGroup" ADD COLUMN "icon" TEXT;

-- Migrate existing skills String[] to Json[] preserving data as {name} objects
-- Step 1: add a temporary json[] column
ALTER TABLE "SkillGroup" ADD COLUMN "skills_new" JSONB[];

-- Step 2: populate it from the old text[] column
UPDATE "SkillGroup"
SET "skills_new" = ARRAY(
  SELECT jsonb_build_object('name', s)
  FROM unnest("skills") s
);

-- Step 3: drop the old text[] column
ALTER TABLE "SkillGroup" DROP COLUMN "skills";

-- Step 4: rename the new column
ALTER TABLE "SkillGroup" RENAME COLUMN "skills_new" TO "skills";

-- Step 5: set NOT NULL with empty array as default for new rows
ALTER TABLE "SkillGroup" ALTER COLUMN "skills" SET DEFAULT '{}';
ALTER TABLE "SkillGroup" ALTER COLUMN "skills" SET NOT NULL;
