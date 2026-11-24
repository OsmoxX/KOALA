-- DropIndex
DROP INDEX "teams_teacher_id_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "teams_teacher_id_category_id_name_key" ON "teams"("teacher_id", "category_id", "name");
