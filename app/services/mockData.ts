import { Lesson } from "../types";
import { createInitialSRSState } from "./srs";

// This file simulates the "Server Database"

export const SERVER_LESSONS: Partial<Lesson>[] = [
  {
    id: "server-lesson-001",
    title: "Business English: Negotiations",
    description: "Learn essential phrases for negotiating contracts, discussing terms, and reaching agreements in a professional setting.\n\nKey topics:\n- Making proposals\n- Rejecting offers politely\n- Closing the deal",
    createdAt: 1715000000000,
    // Using a reliable sample audio file for demo purposes
    audioUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav", 
    flashcards: [
      { id: "fc-001", front: "Compromise", back: "An agreement in an argument in which the people involved reduce their demands or change their opinion in order to agree.", ...createInitialSRSState() },
      { id: "fc-002", front: "Leverage", back: "Power to influence people and get the results you want.", ...createInitialSRSState() },
      { id: "fc-003", front: "Bottom line", back: "The least amount of money that you are willing to accept in a business transaction.", ...createInitialSRSState() },
      { id: "fc-004", front: "Deadlock", back: "A situation in which agreement in an argument cannot be reached because neither side will change its demands.", ...createInitialSRSState() },
      { id: "fc-005", front: "Counter-offer", back: "An offer that is made by one side in a disagreement after the other side has made an offer that is not acceptable.", ...createInitialSRSState() },
    ]
  },
  {
    id: "server-lesson-002",
    title: "Travel Survival Kit: Japan",
    description: "Essential vocabulary for your trip to Tokyo. Covers asking for directions, ordering food, and emergency situations.",
    createdAt: 1715100000000,
    audioUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars3.wav",
    flashcards: [
      { id: "fc-006", front: "Sumimasen", back: "Excuse me / Sorry", ...createInitialSRSState() },
      { id: "fc-007", front: "Eki wa doko desu ka?", back: "Where is the station?", ...createInitialSRSState() },
      { id: "fc-008", front: "Kore wo kudasai", back: "I'll have this one, please.", ...createInitialSRSState() },
      { id: "fc-009", front: "Eigo no menyu", back: "English menu", ...createInitialSRSState() },
    ]
  }
];