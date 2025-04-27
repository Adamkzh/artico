from language.language import Language

class PromptGenerator:
    DEFAULT_ROLE = "adult"

    ROLE_STYLES = {
        "child": (
            "You are a patient and engaging museum guide who specializes in explaining artworks to children. "
            "You use simple, vivid language, and encourage imagination in your storytelling."
        ),
        "adult": (
            "You are an experienced museum docent"
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

    def __init__(self, language: str, role: str = DEFAULT_ROLE):
        self.language = language
        self.target_language = Language.from_code(language)
        self.role = role if role in self.ROLE_STYLES else self.DEFAULT_ROLE
        self.base_prompt = self.generate_context()

    def generate_role(self) -> str:
        """
        Return the role identity sentence (in English).
        """
        return self.ROLE_STYLES[self.role]

    def generate_context(self) -> str:
        """
        Generate the context prompt (in English), customized by role,
        focusing on appropriate storytelling style for each audience.
        """

        if self.role == "child":
            base_prompt = (
                "Please create a fun and vivid spoken explanation about this artwork, aimed at young children. "
                "Use simple, imaginative language and avoid complex or technical terms. "
                "Briefly describe what the painting shows, what colors and shapes you see, and what kind of story it might be telling. "
                f"The explanation should be spoken in {self.target_language}."
            )

        elif self.role == "senior":
            base_prompt = (
                "Please create a warm, respectful spoken explanation about this artwork, suitable for senior visitors. "
                "Speak at a slightly slower pace. Include five key aspects: "
                "what the artwork depicts (its subject), how it's composed (style, color, brushwork), "
                "the background story of the artist and historical context, the possible meaning or message behind the piece. "
                f"The explanation should be spoken in {self.target_language}."
            )

        elif self.role == "expert":
            base_prompt = (
                "Please generate a professional spoken analysis of this artwork, aimed at experts in art history. "
                "Touch on the following aspects: subject matter and iconography, formal elements and techniques, "
                "art historical and socio-political context, interpretive meaning, and lasting impact or critical reception. "
                "Use precise terminology and a scholarly tone while keeping the narrative engaging. Limit to about 60 seconds. "
                f"The explanation should be spoken in {self.target_language}."
            )

        else:  # default: adult
            base_prompt = (
                "Please create a spoken explanation about this artwork, aimed at general visitors. "
                "Speak in a natural, engaging tone, as if chatting face-to-face. "
                "Focus on interesting stories, historical background, and little-known facts behind the creation of the artwork, "
                "rather than just describing what’s in the painting. "
                "Feel free to include emotional elements and vivid details to spark the listener's imagination. "
                "No strict time limit — tell the story fully and captivatingly in your own words. "
                f"The explanation should be spoken in {self.target_language}."
            )

        return base_prompt

    def generate_structure_prompt(self) -> str:
        """
        Generate a special prompt that instructs GPT to return a structured JSON object.
        """
        return (
                "Please analyze the artwork and respond ONLY with a JSON object containing: "
                "- title: (string) the name of the artwork"
                "- artist: (string) the name of the artist"
                "- museum_name: (string) the name of the museum"
                f"- description: (string) {self.base_prompt}"
                "No extra explanations. Only output a pure JSON object."
            )

    def generate_full_prompt(self) -> str:
        """
        Combine role description and context prompt.
        """
        return self.generate_role() + "\n\n" + self.generate_context()
