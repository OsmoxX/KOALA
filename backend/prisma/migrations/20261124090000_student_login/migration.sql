-- AlterTable
ALTER TABLE "users" ADD COLUMN     "login" TEXT,
ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");
