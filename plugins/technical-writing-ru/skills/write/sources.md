# Источники

## Содержание

- Как читать этот файл
- Процесс и качество
- Структура и чтение
- Стиль
- Типы документов
- Паттерны и формат скилла
- На что скилл не опирается

## Как читать этот файл

В каждой строке указан источник, что скилл из него берёт и где это правило стоит. Текст в кавычках сверен с оригинальной веб-страницей и приведён на языке оригинала. Правила из книг пересказаны без кавычек, а термины из книг выделены курсивом: самих книг для сверки не было. Для книг, вышедших по-русски, указано русское издание, если его удалось подтвердить по сайтам издательств и книжных магазинов. Цифр из книг здесь нет, кроме одной: 10% в формуле Кинга. Она сверена по опубликованным фрагментам книги, где формула приведена; сама книга для сверки недоступна. Англоязычные источники по стилю (Зинсер, Странк и Уайт, Оруэлл) перечислены для паритета с английской версией скилла; их правила используются только там.

## Процесс и качество

| Источник | Что берёт скилл | Где в скилле |
|---|---|---|
| Jared Bhatti, Zachary Sarah Corleissen, Jen Lambourne, David Nunez, Heidi Waterhouse. *Docs for Developers: An Engineer's Field Guide to Technical Writing*. Apress. | Процесс документирования: от аудитории и плана через черновик, правку, примеры, визуальное содержимое и публикацию к обратной связи, метрикам, поддержке и списанию. | SKILL.md, порядок работы и общие правила (аудитория, план, черновик, проходы правки, примеры, визуальное содержимое); process/doc-set.md (публикация, обратная связь, метрики, поддержка и списание) |
| Michelle Carey, Moira McFadden Lanyi, Deirdre Longo, Eric Radzinski, Shannon Rouiller, Elizabeth Wilde. *Developing Quality Technical Information: A Handbook for Writers and Editors*, 3-е изд. IBM Press. В ранних изданиях первым автором указана Gretchen Hargis. | Девять характеристик качества в трёх группах: *easy to use* (ориентация на задачу, точность, полнота), *easy to understand* (ясность, конкретность, стиль), *easy to find* (организация, находимость, визуальная выразительность). Названия сверены с описанием издателя. | process/review.md |
| Mark Baker. *Every Page is Page One: Topic-Based Writing for Technical Communication and the Web*. XML Press. | Самодостаточная страница и семь её признаков по списку на сайте автора everypageispageone.com. | SKILL.md, общие правила; process/review.md |
| John M. Carroll. *The Nurnberg Funnel: Designing Minimalist Instruction for Practical Computer Skill*. MIT Press. John M. Carroll (ред.), среди авторов Hans van der Meij. *Minimalism Beyond the Nurnberg Funnel*. MIT Press. | Минимализм: ориентироваться на реальную задачу читателя, убирать то, что ей не служит, помогать распознать ошибку и выйти из неё. | types/tutorial.md, types/how-to.md, types/troubleshooting.md |
| Google. Documentation best practices, «Minimum viable documentation». google.github.io/styleguide/docguide | «A small set of fresh and accurate docs is better than a large assembly of „documentation“ in various states of disrepair.» | process/doc-set.md |
| Write the Docs. Documentation principles. writethedocs.org/guide/writing/docs-principles | ARID: «Accept (some) Repetition In Documentation». Принципы Skimmable, Exemplary, Current: «Consider incorrect documentation to be worse than missing documentation.» | SKILL.md, общие правила |

## Структура и чтение

| Источник | Что берёт скилл | Где в скилле |
|---|---|---|
| Janice (Ginny) Redish. *Letting Go of the Words: Writing Web Content that Works*. Morgan Kaufmann. | Заголовки, которые несут главную мысль; страница как одна реплика в разговоре, который начинается с вопроса читателя. | SKILL.md, общие правила; process/doc-set.md |
| Стив Круг. «Не заставляйте меня думать: Веб-юзабилити и здравый смысл». Эксмо. Оригинал: Steve Krug. *Don't Make Me Think*. New Riders. | Читатель пробегает страницу глазами; убрать *happy talk* и инструкции, которых никто не читает. Третий закон Круга, о сокращении большой доли слов на веб-странице, применяется только к навигационному тексту: посадочным страницам и README. | types/readme.md |
| Барбара Минто. «Принцип пирамиды Минто: Золотые правила мышления, делового письма и устных выступлений». Манн, Иванов и Фербер. Оригинал: Barbara Minto. *The Pyramid Principle: Logic in Writing and Thinking*. Pearson. | Сначала ответ, потом доводы; SCQA (ситуация, осложнение, вопрос, ответ) в начале объяснения или дизайн-документа. | SKILL.md, общие правила; types/explanation.md, types/adr.md |
| Diátaxis, автор Daniele Procida. diataxis.fr | Оси «действие и понимание» и «учёба и работа», которые разделяют tutorial, how-to, reference и explanation. Для tutorial: «мы», цель в начале и «Ruthlessly minimise explanation» со ссылкой на подробное объяснение. Скилл оставляет в tutorial короткие объяснения. | SKILL.md, выбор типа; types/tutorial.md |

## Стиль

| Источник | Что берёт скилл | Где в скилле |
|---|---|---|
| Joseph M. Williams (поздние издания вместе с Joseph Bizup). *Style: Lessons in Clarity and Grace*. Pearson. | Персонажи в подлежащем и действия в глаголе; номинализации; от известного к новому; тема абзаца в его начале. | style/russian.md; SKILL.md, общие правила (связность) |
| Стивен Пинкер. «Чувство стиля». Оригинал: Steven Pinker. *The Sense of Style*. Viking. | Классический стиль; проклятие знания; метатекст; навязчивые оговорки. Средство от проклятия знания: проверка холодным читателем. | style/russian.md; style/llm-patterns.md; SKILL.md, шаг 8 порядка работы |
| Уильям Зинсер. «Как писать хорошо: Классическое руководство по созданию нехудожественных текстов». Альпина Паблишер. Оригинал: William Zinsser. *On Writing Well*. Harper. | Словесный мусор и способы его вычистить. | файл стиля английской версии |
| William Strunk Jr., E. B. White. *The Elements of Style*. | Действительный залог; определённый, конкретный язык; лишние слова убрать. | файл стиля английской версии |
| George Orwell. *Politics and the English Language*. Эссе. | Короткое обиходное слово лучше длинного; убрать слово, если без него можно; действительный залог. | файл стиля английской версии |
| Стивен Кинг. «Как писать книги: Мемуары о ремесле». АСТ. Оригинал: Stephen King. *On Writing: A Memoir of the Craft*. Scribner. | Второй черновик равен первому минус около 10%. Эту формулу Кинг взял из отказа редактора. Скилл использует её как ориентир. | SKILL.md, шаг 5 порядка работы |
| Максим Ильяхов, Людмила Сарычева. «Пиши, сокращай: Как создавать сильный текст». Альпина Паблишер. Максим Ильяхов. «Ясно, понятно». Альпина Паблишер. | Стоп-слова по категориям; факт вместо оценки. | style/russian.md; паттерн оценки есть и в style/llm-patterns.md |
| Нора Галь. «Слово живое и мёртвое». Корней Чуковский. «Живой как жизнь». | Канцелярит, отглагольные существительные, цепочки родительного падежа. Слово «канцелярит» ввёл Чуковский. | style/russian.md |
| А. Э. Мильчин, Л. К. Чельцова. «Справочник издателя и автора: Редакционно-издательское оформление издания». | Русская типографика: ё, кавычки, тире, дефис, неразрывный пробел, числа. | style/russian.md и русские правила скрипта проверки |

## Типы документов

| Источник | Что берёт скилл | Где в скилле |
|---|---|---|
| Бетси Бейер, Крис Джоунс, Дженнифер Петофф, Нейл Ричард Мёрфи (ред.). «Site Reliability Engineering. Надёжность и безотказность как в Google». Питер. Оригинал: *Site Reliability Engineering*. O'Reilly, глава «Postmortem Culture: Learning from Failure», sre.google. Также *The Site Reliability Workbook*. | Постмортем без поиска виноватых сосредоточен «on identifying the contributing causes of the incident without indicting any individual or team». Содержание постмортема: влияние, принятые меры, коренные причины, последующие действия. | types/postmortem.md |
| Scott Bradner. RFC 2119, *Key words for use in RFCs to Indicate Requirement Levels*. IETF. | Ключевые слова уровней требований: MUST, MUST NOT, SHOULD, SHOULD NOT, MAY. | types/conventions.md |
| Michael Nygard. «Documenting Architecture Decisions». Блог Cognitect. | Разделы ADR: название, контекст, решение, статус, последствия. Решение записывают «in full sentences, with active voice. „We will …“». Перечислены все последствия. Одна-две страницы. Заменённое решение остаётся в репозитории со статусом superseded. | types/adr.md |
| Olivier Lacan. Keep a Changelog 1.1.0. keepachangelog.com | «Changelogs are for humans, not machines.» Типы изменений Added, Changed, Deprecated, Removed, Fixed, Security; последняя версия сверху; даты в ISO 8601. | types/changelog.md |
| David Goodger, Guido van Rossum. PEP 257, Docstring Conventions. peps.python.org | Однострочный docstring предписывает эффект в форме команды («Do this», «Return that») и не повторяет сигнатуру. | types/docstring.md |
| John Ousterhout. *A Philosophy of Software Design*. Yaknyam Press. | Комментарий описывает то, чего не видно из кода; комментарий интерфейса отделён от комментария реализации. | types/docstring.md |
| Google. Technical Writing, «Error messages». developers.google.com/tech-writing | Назвать причину, назвать неверный ввод пользователя, указать требования и ограничения, объяснить, как исправить, привести пример. | types/cli-help-errors.md |

## Паттерны и формат скилла

| Источник | Что берёт скилл | Где в скилле |
|---|---|---|
| Wikipedia. «Wikipedia:Signs of AI writing». en.wikipedia.org | Каталог паттернов: раздутая значимость, рекламный язык, размытые ссылки на авторитет, поверхностный анализ, слова, типичные для модели, уход от связки, отрицательный параллелизм, правило трёх, частые тире, избыток полужирного, следы переписки. | style/llm-patterns.md |
| Anthropic. Skill authoring best practices. platform.claude.com/docs | Описание в третьем лице; ссылки из SKILL.md только на один уровень; оглавление в файлах длиннее 100 строк; копируемые чек-листы порядка работы; единая терминология; никакого текста, который устаревает со временем. | устройство всего скилла |
| Anthropic. Claude Code skills documentation. code.claude.com/docs/en/skills | Поле `when_to_use` и общий лимит на `description` и `when_to_use`; `${CLAUDE_SKILL_DIR}` в путях к скриптам; после автокомпакции SKILL.md остаётся в контексте только в пределах бюджета токенов, поэтому он короткий. | frontmatter и длина SKILL.md |

## На что скилл не опирается

Nielsen Norman Group опубликовала исследование чтения в вебе, проведённое в 1997 году на туристическом сайте о Небраске. Оно измеряло удобство рекламного веб-текста и ничего не говорит о технической документации. Скилл не использует его цифры как довод; самое большее, выводы о беглом просмотре применимы к навигационному тексту.

Пересказы в блогах и SEO-статьи о письме источниками не служат.
