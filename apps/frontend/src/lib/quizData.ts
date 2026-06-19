export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  hint: string;
  explanation: string;
}

export const quizData: QuizQuestion[] = [
  {
    id: 1,
    question: "¿Hacia dónde apuntan las líneas de campo eléctrico generadas por una carga positiva aislada?",
    options: [
      "Hacia afuera, alejándose radialmente de la carga.",
      "Hacia adentro, acercándose a la carga.",
      "Forman círculos cerrados alrededor de la carga."
    ],
    correctAnswerIndex: 0,
    hint: "Pista: Añade una carga positiva en el simulador y observa la dirección de las flechas.",
    explanation: "Por convención física, las líneas de campo siempre 'nacen' o apuntan hacia afuera de las cargas positivas."
  },
  {
    id: 2,
    question: "Si colocas dos cargas del mismo signo muy cerca, ¿qué patrón forman las líneas de campo entre ellas?",
    options: [
      "Van de una carga hacia la otra en línea recta.",
      "Se cruzan entre sí formando una red.",
      "Se repelen y nunca se cruzan, dejando un espacio vacío en el centro."
    ],
    correctAnswerIndex: 2,
    hint: "Pista: Coloca dos cargas positivas juntas y fíjate qué pasa en el punto medio exacto.",
    explanation: "Las líneas de campo de cargas de igual signo se repelen. En el punto medio exacto, los campos se cancelan y el campo eléctrico neto es cero."
  },
  {
    id: 3,
    question: "¿Qué ocurre con la fuerza del campo eléctrico a medida que te alejas de una carga puntual?",
    options: [
      "Aumenta a medida que te alejas.",
      "Disminuye progresivamente.",
      "Se mantiene siempre con la misma fuerza."
    ],
    correctAnswerIndex: 1,
    hint: "Pista: Observa la densidad de las flechas. ¿Están más juntas cerca o lejos de la carga?",
    explanation: "El campo eléctrico disminuye de forma inversamente proporcional al cuadrado de la distancia. Mientras más te alejas, más débil se vuelve."
  }
];
