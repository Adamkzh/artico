from deep_translator import GoogleTranslator
from enum import Enum

class Language(Enum):
    ZH = ('chinese (simplified)', 'Chinese')
    ES = ('spanish', 'Spanish')
    EN = ('english', 'English')
    FR = ('french', 'French')
    DE = ('german', 'German')
    JA = ('japanese', 'Japanese')
    KO = ('korean', 'Korean')
    RU = ('russian', 'Russian')
    PT = ('portuguese', 'Portuguese')
    IT = ('italian', 'Italian')

    def __init__(self, code, description):
        self.code = code
        self.description = description

    @classmethod
    def from_code(cls, code: str) -> 'Language':
        for lang in cls:
            if lang.code == code:
                return lang
        raise ValueError(f"Unknown language code: {code}")

    @classmethod
    def from_description(cls, description: str) -> 'Language':
        for lang in cls:
            if lang.description.lower() == description.lower():
                return lang
        raise ValueError(f"Unknown language description: {description}")

    @staticmethod
    def translate_to_language(text: str, target_language: 'Language') -> str:
        translated_text = GoogleTranslator(source='auto', target=target_language.code).translate(text)
        return translated_text
