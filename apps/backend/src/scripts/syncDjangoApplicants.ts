import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const DJANGO_CRM_URL = process.env.DJANGO_CRM_URL || 'http://localhost:8000';

async function main() {
  console.log(`[SYNC] Подключение к Django CRM: ${DJANGO_CRM_URL}`);
  
  try {
    // ВНИМАНИЕ: Замените '/api/export/applicants/' на реальный эндпоинт вашего Django проекта!
    const response = await fetch(`${DJANGO_CRM_URL}/api/export/applicants/`);
    
    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Django: ${response.status} ${response.statusText}`);
    }

    const applicants = await response.json() as Array<{
      id: number;
      full_name: string;
      full_name_en: string;
      passport_number: string;
    }>;

    console.log(`[SYNC] Найдено ${applicants.length} абитуриентов в CRM.`);

    let createdCount = 0;
    let updatedCount = 0;
    
    // Массив для сохранения в CSV
    const csvRows: string[] = [];
    csvRows.push('ID,ФИО,Логин (Email),Пароль (Паспорт)');

    for (const app of applicants) {
      if (!app.passport_number) {
        console.warn(`[SYNC] У абитуриента ID ${app.id} нет номера паспорта, пропускаем.`);
        continue;
      }

      // Используем готовые английские поля из CRM
      const cleanNameEn = (app.full_name_en || app.full_name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
      // Добавляем ID в email чтобы избежать конфликтов
      const fakeEmail = `${cleanNameEn}${app.id}@ulsu.ru`;
      
      const fullName = (app.full_name || app.full_name_en || 'Абитуриент CRM').trim();

      const existingUser = await prisma.user.findFirst({
        where: { 
          OR: [
            { email: fakeEmail },
            { crmApplicantId: app.id }
          ]
        }
      });

      if (existingUser) {
        // Обновляем существующего
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            crmApplicantId: app.id,
            applicationStatus: 'ACCEPTED',
            appRole: 'APPLICANT',
          }
        });
        updatedCount++;
      } else {
        // Создаем нового
        const passwordHash = await bcrypt.hash(app.passport_number, 10);
        await prisma.user.create({
          data: {
            email: fakeEmail,
            fullName: fullName || 'Абитуриент CRM',
            passwordHash,
            role: 'USER',
            appRole: 'APPLICANT',
            applicationStatus: 'ACCEPTED', // Триггер для интерфейса (без квестов)
            crmApplicantId: app.id,
          }
        });
        createdCount++;
      }
      
      // Добавляем данные в таблицу (и для новых, и для обновленных)
      csvRows.push(`"${app.id}","${fullName}","${fakeEmail}","${app.passport_number}"`);
    }

    // Сохраняем CSV файл
    const csvPath = path.join(process.cwd(), 'applicants_credentials.csv');
    // Добавляем BOM (\uFEFF) в начало файла, чтобы Excel правильно читал кириллицу
    fs.writeFileSync(csvPath, '\uFEFF' + csvRows.join('\n'), 'utf8');

    console.log(`\n[SYNC] ЗАВЕРШЕНО!`);
    console.log(`- Создано новых профилей: ${createdCount}`);
    console.log(`- Обновлено существующих: ${updatedCount}`);
    console.log(`\n✅ Файл с доступами успешно сохранен: ${csvPath}`);
    console.log(`Вы можете открыть его в Excel и отправить абитуриентам.`);

  } catch (err) {
    console.error(`[SYNC] Критическая ошибка:`, err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
