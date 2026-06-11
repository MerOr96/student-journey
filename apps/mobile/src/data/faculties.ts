// Список факультетов УлГУ — используется в мобильном приложении
// Должен соответствовать apps/backend/src/data/faculties.ts

export interface FacultyShort {
  id: number;
  name: string;
  specialtyCount: number;
}

export const FACULTIES: FacultyShort[] = [
  { id: 1, name: 'Инженерно-физический факультет высоких технологий', specialtyCount: 5 },
  { id: 2, name: 'Факультет математики, информационных и авиационных технологий', specialtyCount: 6 },
  { id: 3, name: 'Институт экономики и бизнеса', specialtyCount: 3 },
  { id: 4, name: 'Юридический факультет', specialtyCount: 1 },
  { id: 5, name: 'Факультет гуманитарных наук и социальных технологий', specialtyCount: 3 },
  { id: 6, name: 'Факультет культуры и искусства', specialtyCount: 2 },
  { id: 7, name: 'Факультет лингвистики, межкультурных связей и профессиональной коммуникации', specialtyCount: 1 },
  { id: 8, name: 'Институт медицины, экологии и физической культуры', specialtyCount: 11 },
];
