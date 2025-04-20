from language.language import Language

class PromptGenerator:
    DEFAULT_ROLE = "adult"

    ROLE_STYLES = {
        "child": (
            "You are a patient and engaging museum guide who specializes in explaining artworks to children. "
            "You use simple, vivid language, and encourage imagination in your storytelling."
        ),
        "adult": (
            "You are an experienced museum docent who speaks in a warm and engaging tone. "
            "You explain the background, style, and significance of artworks in an accessible and friendly way."
        ),
        "senior": (
            "You are a considerate museum guide who speaks clearly and slowly. "
            "You help senior visitors understand artworks by using simple, respectful, and culturally rich explanations."
        ),
        "expert": (
            "You are an art historian giving in-depth museum tours. "
            "You use precise, professional language, and explain the historical background, style, techniques, and significance of artworks."
        )
    }

    def __init__(self, language_description: str, role: str = DEFAULT_ROLE):
        self.language_description = language_description
        self.target_language = Language.from_description(language_description)
        self.role = role if role in self.ROLE_STYLES else self.DEFAULT_ROLE

    def generate_role(self) -> str:
        """
        Return the role identity sentence (in English).
        """
        return self.ROLE_STYLES[self.role]

    def generate_context(self) -> str:
        """
        Generate the context prompt (in English), customized by role.
        """
        if self.role == "child":
            base_prompt = (
                "Please create a spoken explanation about this artwork, aimed at young children. "
                "Use simple, lively language, and feel free to spark imagination. "
                "Avoid complex or technical terms.  Limit to about 30 seconds."
                f"The explanation should be spoken in {self.language_description}."
            )
        elif self.role == "senior":
            base_prompt = (
                "Please create a spoken explanation about this artwork, suitable for senior visitors. "
                "Use clear, warm, and respectful language, speak at a slightly slower pace, "
                "and include information about the artist, creation time, and background.  Limit to about 60 seconds."
                f"The explanation should be spoken in {self.language_description}."
            )
        elif self.role == "expert":
            base_prompt = (
                "Please create a professional spoken explanation about this artwork, intended for experts in art history. "
                "Include discussions of style, techniques, background, and historical significance. "
                "Use accurate terminology but keep it engaging. Limit to about 60 seconds. "
                f"The explanation should be spoken in {self.language_description}."
            )
        else:  # default: adult
            base_prompt = (
                "Please create a spoken explanation about this artwork for general visitors. "
                "Use a natural and engaging tone, as if speaking face-to-face. "
                "Include the artwork's name, artist, year of creation, story background, and artistic style. "
                "Keep it around 30 seconds. "
                f"The explanation should be spoken in {self.language_description}."
            )

        return base_prompt

    def generate_full_prompt(self) -> str:
        """
        Combine role description and context prompt.
        """
        return self.generate_role() + "\n\n" + self.generate_context()
