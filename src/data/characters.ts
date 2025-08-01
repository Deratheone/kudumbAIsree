export interface Character {
  id: string;
  name: string;
  position: { x: number; y: number }; // Percentage positioning
  avatar: string;
  systemPrompt: string;
  fallbackResponse: string;
  fallbackResponses: string[];
}

export const characters: Record<string, Character> = {
  babu: {
    id: 'babu',
    name: 'Babu',
    position: { x: 20, y: 60 }, // Left side
    avatar: '🧑🏽‍🌾',
    systemPrompt: `Babu: wise Kerala farmer. 1 sentence only.`,
    fallbackResponse: "You know life is like farming - you plant good seeds, you get good harvest",
    fallbackResponses: [
      "You know, machane, life is like farming - you plant good seeds, you get good harvest, alle?",
      "In my experience, nature teaches us patience. Everything has its season, no?",
      "Eda, these rains are perfect for the paddy fields. God's blessing, alle?",
      "You know what they say - early to bed, early to rise, like the farmers do!",
      "Nature never hurries, yet everything is accomplished in time, machane.",
      "This coconut tree here, it's been giving us shade for 30 years. That's true wealth, no?"
    ]
  },
  aliyamma: {
    id: 'aliyamma',
    name: 'Aliyamma',
    position: { x: 40, y: 55 }, // Left-center
    avatar: '👩🏽‍🦳',
    systemPrompt: `Aliyamma: caring Kerala grandmother. 1 sentence only.`,
    fallbackResponse: "Ente mole, these days children don't know the value of family time, no?",
    fallbackResponses: [
      "Ente mole, these days children don't know the value of family time, no?",
      "I made some fresh payasam today - you all should come and try, kuttikale!",
      "When I was young, we used to respect our elders so much. Times have changed, no?",
      "Family is everything, mole. Money comes and goes, but family stays forever.",
      "These festivals are not the same without all the children around, ente!",
      "I still remember my grandmother's recipes - those were the real tastes, mole!"
    ]
  },
  mary: {
    id: 'mary',
    name: 'Fathima',
    position: { x: 63, y: 55 }, // Right-center  
    avatar: '👩🏽',
    systemPrompt: `Fathima: modern Kerala working woman. 1 sentence only.`,
    fallbackResponse: "These days, women have to manage everything - office, home, everything. Very difficult, no?",
    fallbackResponses: [
      "These days, women have to manage everything - office, home, everything. Very difficult, no?",
      "Technology is making life easier, but also more complicated somehow!",
      "My daughter is learning coding now - girls can do anything these days, alle?",
      "Work from home has its benefits, but I miss the office conversations.",
      "Education is so important for women - it gives us independence and confidence.",
      "Balancing tradition and modernity is the biggest challenge for our generation."
    ]
  },
  chakko: {
    id: 'chakko',
    name: 'Chakko',
    position: { x: 87, y: 60 }, // Right side
    avatar: '👨🏽',
    systemPrompt: `Chakko: friendly Kerala neighbor, jokes and light gossip. 1 sentence only.`,
    fallbackResponse: "Eda machane, without some fun and jokes, life becomes too serious, alle? Adipoli!",
    fallbackResponses: [
      "Eda machane, without some fun and jokes, life becomes too serious, alle? Adipoli!",
      "Did you hear about Ravi's new scooter? It makes more noise than my old motorcycle! Pwoli!",
      "My wife says I talk too much, but here I am talking even more! Machane, what to do?",
      "This weather is perfect for sitting outside and chatting, no? Adipoli evening!",
      "Life is too short to be serious all the time - we need to laugh and enjoy, alle?",
      "You know what they say - a day without laughter is a day wasted! Pwoli philosophy, no?"
    ]
  }
};

export const characterOrder = ['babu', 'aliyamma', 'mary', 'chakko'];
