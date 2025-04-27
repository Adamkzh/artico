from deep_translator import GoogleTranslator
from enum import Enum

class Language(Enum):
    ZH = ('zh', 'Chinese')
    ES = ('es', 'Spanish')
    EN = ('en', 'English')
    FR = ('fr', 'French')
    DE = ('de', 'German')
    JA = ('ja', 'Japanese')
    KO = ('ko', 'Korean')
    RU = ('ru', 'Russian')
    PT = ('pt', 'Portuguese')
    IT = ('it', 'Italian')

    def __init__(self, code, description):
        self.code = code
        self.description = description

    @classmethod
    def from_code(cls, code: str) -> 'Language':
        for lang in cls:
            if lang.code == code:
                return lang
        raise ValueError(f"Unknown language code: {code}")

    @staticmethod
    def translate_to_language(text: str, target_language: 'Language') -> str:
        translated_text = GoogleTranslator(source='auto', target=target_language.code).translate(text)
        return translated_text
