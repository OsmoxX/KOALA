// Typy danych używane we frontendzie KOALA

// Podstawowe informacje o drużynie
export type TeamSummary = {
  id: string;
  name: string;
  categoryName: string;
  studentsCount: number;
};

// Kategoria wiekowa drużyny
export type TeamCategory = {
  id: string;
  name: string;
  minMembers: number;
  maxMembers: number;
};

// Dane ucznia
export type Student = {
  id: string;
  firstName: string;
  login: string;
};

// Szczegółowe informacje o drużynie
export type TeamDetails = TeamSummary & {
  minMembers: number;
  maxMembers: number;
  students: Student[];
};

// Dane logowania wygenerowane dla nowego ucznia
export type StudentCredentials = {
  student: Student;
  login: string;
  temporaryPassword: string;
};

// Zadanie konkursowe
export type StudentTask = {
  id: string;
  title: string;
  status: string;
};

// Profil ucznia
export type StudentProfile = {
  firstName: string;
  login: string;
  tasks?: StudentTask[];

  team: {
    name: string;
    schoolName: string;
    categoryName: string;

    members: Array<{
      id: string;
      firstName: string;
    }>;
  };
};