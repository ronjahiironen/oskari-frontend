Oskari.registerLocalization(
{
    "lang": "ru",
    "key": "Printout",
    "value": {
        "title": "Печать",
        "flyouttitle": "Печать",
        "desc": "",
        "btnTooltip": "Печать текущего вида карты в формате PNG или PDF.",
        "BasicView": {
            "title": "Печать вида карты",
            "name": {
                "label": "Название карты",
                "placeholder": "требуемый",
                "tooltip": "Введите название для печати. Обратите внимание на язык, используемый в слоях карты."
            },
            "language": {
                "label": "Язык",
                "options": {
                    "fi": "Финский",
                    "sv": "Шведский",
                    "en": "Английский"
                },
                "tooltip": "Выберите язык для печати. Обратите внимание на язык, используемый в пользовательском интерфейсе и слоях карты."
            },
            "size": {
                "label": "Размер и направление",
                "tooltip": "Выберите размер печати и направление. Вы можете видеть обновления на предварительном просмотре изображения.",
                "options": {
                    "A4": "A4 книжная",
                    "A4_Landscape": "A4 альбомная",
                    "A3": "A3 книжная",
                    "A3_Landscape": "A3 альбомная"
                }
            },
            "preview": {
                "label": "Предпросмотр",
                "pending": "Изображение предпросмотра вскоре обновится.",
                "notes": {
                    "extent": "Проверьте масштаб области карты на предварительном изображении.",
                    "restriction": "На предварительном изображении отображается только картографическая основа."
                }
            },
            "buttons": {
                "save": "Печать",
                "ok": "OK",
                "back": "Предыдущий",
                "cancel": "Отменить"
            },
            "location": {
                "label": "Расположение и масштаб",
                "tooltip": "Масштаб распечатки соответствует масштабу, используемому в предварительном изображении.",
                "zoomlevel": "Масштаб"
            },
            "settings": {
                "label": "Дополнительные настройки",
                "tooltip": "Выбрать настройки для вашей печати."
            },
            "format": {
                "label": "Формат файла",
                "tooltip": "Выбрать формат файла для вашей печати.",
                "options": {
                    "png": "PNG изображение",
                    "pdf": "PDF документ"
                }
            },
            "mapTitle": {
                "label": "Название карты",
                "tooltip": "Добавить название для карты."
            },
            "content": {
                "pageScale": {
                    "label": "Добавьте масштаб при печати карты.",
                    "tooltip": "Добавьте масштаб карты, по желанию."
                },
                "pageDate": {
                    "label": "Использовать текущую дату",
                    "tooltip": "Вы можете добавить дату при печати карты."
                }
            },
            "help": "Помощь",
            "error": {
                "title": "Ошибка",
                "size": "Ошибка в настройках размера",
                "name": "Ввод названия является обязательным",
                "nohelp": "Вспомогательная информация отсутствует.",
                "saveFailed": "Печать вида карты не удалась. Повторите попытку позже.",
                "nameIllegalCharacters": "Название содержит запрещенные символы. Разрешенные символы буквы: a-z, а также å, ä and ö, номера, пробелы и дефисы."
            },
            "scale": {
                "label": "Масштаб",
                "tooltip": "Укажите масштаб для печати",
                "map": "Используйте масштаб карты",
                "defined": "Выбрать масштаб",
                "unsupportedLayersMessage": "На распечатке не отображаются следующие слои",
                "unsupportedLayersTitle": "Распечатка не показывает все слои"
            }
        },
        "StartView": {
            "text": "Вы можете распечатать карту в форматах PDF и PNG.",
            "info": {
                "maxLayers": "В распечатке можно использовать не более восьми слоев карты.",
                "printoutProcessingTime": "Печать вида карты может занять некоторое время при выборе нескольких слоев."
            },
            "buttons": {
                "continue": "Продолжить",
                "cancel": "Отменить"
            }
        }
    }
});
