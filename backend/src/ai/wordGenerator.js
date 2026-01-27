// Palabras estáticas por categoría
const WORDS_BY_CATEGORY = {
  Cantantes: [
    ["Shakira", "Karol G"],
    ["Bad Bunny", "J Balvin"],
    ["Adele", "Taylor Swift"]
  ],

  Famosos: [
    ["Messi", "Cristiano Ronaldo"],
    ["Elon Musk", "Jeff Bezos"],
    ["MrBeast", "Ibai"]
  ],

  Películas: [
    ["Titanic", "Avatar"],
    ["Matrix", "Inception"],
    ["Gladiador", "Troya"]
  ],

  "Personajes Públicos": [
    ["Obama", "Trump"],
    ["Napoleón", "Julio César"]
  ],

  Juegos: [
    ["Dota 2", "League of Legends"],
    ["Minecraft", "Roblox"],
    ["GTA V", "Red Dead Redemption"]
  ],

  "Personajes de Videojuegos": [
    ["Mario", "Sonic"],
    ["Kratos", "Master Chief"],
    ["Link", "Zelda"]
  ],

  Series: [
    ["Breaking Bad", "Better Call Saul"],
    ["Game of Thrones", "House of the Dragon"]
  ],

  Animales: [
    ["León", "Tigre"],
    ["Águila", "Halcón"]
  ],

  "Lugares Famosos": [
    ["París", "Londres"],
    ["Nueva York", "Los Ángeles"]
  ],

  Comida: [
    ["Pizza", "Hamburguesa"],
    ["Sushi", "Ramen"]
  ]
};

export async function generateWords(category) {
  const options = WORDS_BY_CATEGORY[category];

  // Fallback de seguridad
  if (!options || options.length === 0) {
    return {
      palabra_real: "Messi",
      palabra_impostor: "Cristiano Ronaldo"
    };
  }

  // Elegir par random
  const [palabra_real, palabra_impostor] =
    options[Math.floor(Math.random() * options.length)];

  return {
    palabra_real,
    palabra_impostor
  };
}
