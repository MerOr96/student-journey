# Диаграмма 3 — Варианты использования (Use Case)
# На mermaid.live вставлять ТОЛЬКО код ниже (без строк с ```)

graph LR
    classDef actor fill:#FFFFFF,stroke:#333333,color:#000,font-weight:bold
    classDef ucGuest fill:#E8F5E9,stroke:#2E7D32,color:#000,rx:20
    classDef ucStudent fill:#E3F2FD,stroke:#1565C0,color:#000,rx:20
    classDef ucAdmin fill:#FCE4EC,stroke:#B71C1C,color:#000,rx:20

    Guest(["👤
    Гость"])

    Student(["👤
    Студент"])

    Admin(["👤
    Администра-
    тор"])

    subgraph GA ["🟢 Гостевой доступ"]
        UC1(["Зарегистрироваться"])
        UC2(["Войти в систему"])
        UC3(["Просмотреть каталог
        университетов"])
    end

    subgraph SA ["🔵 Личный кабинет студента"]
        UC4(["Просмотреть квесты"])
        UC5(["Выполнить квест
        и получить XP"])
        UC6(["Просмотреть профиль
        и уровень"])
        UC7(["Загрузить документы"])
        UC8(["Подать заявку
        на поступление"])
        UC9(["Рассчитать бюджет
        калькулятор"])
        UC10(["Чат с куратором"])
        UC11(["Сменить язык
        интерфейса"])
    end

    subgraph AA ["🔴 Панель администратора"]
        UC12(["Управлять
        пользователями"])
        UC13(["Управлять заявками
        просмотр и статус"])
        UC14(["Управлять
        факультетами"])
    end

    Guest --> UC1
    Guest --> UC2
    Guest --> UC3

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Student --> UC7
    Student --> UC8
    Student --> UC9
    Student --> UC10
    Student --> UC11

    Admin --> UC2
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14

    UC5 -.->|"include"| UC4
    UC8 -.->|"include"| UC7

    class Guest,Student,Admin actor
    class UC1,UC2,UC3 ucGuest
    class UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11 ucStudent
    class UC12,UC13,UC14 ucAdmin
