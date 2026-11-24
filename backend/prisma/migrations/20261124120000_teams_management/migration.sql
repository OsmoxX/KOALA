-- CreateIndex
CREATE UNIQUE INDEX "teams_teacher_id_name_key" ON "teams"("teacher_id", "name");

-- Kategorie XIII edycji wg regulaminu (KOALA-12): drużyna liczy 3–4 uczniów.
-- Seed danych referencyjnych; istniejące kategorie o tej nazwie zostają bez zmian.
INSERT INTO "team_categories" ("id", "name", "min_members", "max_members")
VALUES
    (gen_random_uuid(), 'Szkoła podstawowa, klasy 6–8', 3, 4),
    (gen_random_uuid(), 'Szkoła ponadpodstawowa', 3, 4)
ON CONFLICT ("name") DO NOTHING;
