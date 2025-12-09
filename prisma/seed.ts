import { PrismaClient, QuestionType } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create an admin user
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@ccwtraining.com" },
    update: {},
    create: {
      email: "admin@ccwtraining.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      authProvider: "EMAIL",
      emailVerified: new Date(),
      isActive: true,
    },
  })
  console.log("✅ Admin user created:", admin.email)

  // Create the CCW Training Course
  const course = await prisma.course.upsert({
    where: { id: "ccw-course-1" },
    update: {},
    create: {
      id: "ccw-course-1",
      title: "Concealed Carry Weapon (CCW) Certification Course",
      description: `Complete your CCW certification from the comfort of your home. This comprehensive online course covers everything you need to know about safely carrying a concealed weapon, including:

- Firearm safety fundamentals
- Arkansas CCW laws and regulations
- Use of force and legal considerations
- Proper carrying techniques and concealment
- Conflict avoidance and de-escalation
- Situational awareness
- Storage and transportation requirements
- Mental preparation and decision making

Upon successful completion of the course and passing the final exam with 80% or higher, you'll receive your official CCW training certificate, which you can submit with your permit application.

Course includes 35-40 training slides and a comprehensive final exam.`,
      price: 39.99,
      isActive: true,
      duration: 120, // 2 hours estimated
      passingScore: 80,
      maxAttempts: 3,
    },
  })
  console.log("✅ Course created:", course.title)

  // Create sample course slides (you'll replace with actual content)
  const slides = [
    {
      slideNumber: 1,
      title: "Welcome to CCW Training",
      content: "Introduction to the course and what you'll learn",
      minViewTime: 10,
    },
    {
      slideNumber: 2,
      title: "Course Overview",
      content: "Structure and requirements for certification",
      minViewTime: 10,
    },
    {
      slideNumber: 3,
      title: "Firearm Safety Rules",
      content: "The four fundamental rules of firearm safety",
      minViewTime: 15,
    },
    {
      slideNumber: 4,
      title: "Types of Firearms",
      content: "Understanding handgun types and their operation",
      minViewTime: 15,
    },
    {
      slideNumber: 5,
      title: "Arkansas CCW Laws",
      content: "State-specific regulations and requirements",
      minViewTime: 15,
    },
    {
      slideNumber: 6,
      title: "Where You Can Carry",
      content: "Permitted and restricted locations",
      minViewTime: 15,
    },
    {
      slideNumber: 7,
      title: "Use of Force",
      content: "Legal standards for self-defense",
      minViewTime: 15,
    },
    {
      slideNumber: 8,
      title: "Conflict Avoidance",
      content: "De-escalation techniques and awareness",
      minViewTime: 15,
    },
    {
      slideNumber: 9,
      title: "Drawing and Presentation",
      content: "Proper techniques for accessing your firearm",
      minViewTime: 15,
    },
    {
      slideNumber: 10,
      title: "Concealment Methods",
      content: "Different carrying positions and holster types",
      minViewTime: 15,
    },
    // Add more slides as needed
  ]

  for (const slideData of slides) {
    await prisma.courseSlide.create({
      data: {
        ...slideData,
        courseId: course.id,
      },
    })
  }
  console.log(`✅ Created ${slides.length} course slides`)

  // Create the quiz for the course
  const quiz = await prisma.quiz.create({
    data: {
      courseId: course.id,
      title: "CCW Certification Final Exam",
      description: "You must score 80% or higher to pass. You have 3 attempts before needing to retake the course.",
      passingScore: 80,
      randomizeQuestions: false,
      showResults: true,
    },
  })
  console.log("✅ Quiz created:", quiz.title)

  // Create sample quiz questions (20 questions for the exam)
  const questions = [
    {
      questionNumber: 1,
      questionText: "What is the first rule of firearm safety?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        "Always keep the gun pointed in a safe direction",
        "Keep your finger off the trigger",
        "Keep the gun unloaded until ready to use",
        "Know your target and what is beyond it",
      ],
      correctAnswer: "Always keep the gun pointed in a safe direction",
      explanation: "The first and most fundamental rule is to always keep the firearm pointed in a safe direction.",
    },
    {
      questionNumber: 2,
      questionText: "In Arkansas, can you carry a concealed weapon in a bank?",
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "In Arkansas, you can carry in banks unless they have posted signage prohibiting it.",
    },
    {
      questionNumber: 3,
      questionText: "What does 'use of force continuum' refer to?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        "The progression of force options from presence to deadly force",
        "The amount of ammunition you can carry",
        "The types of firearms you can own",
        "Training requirements for CCW permits",
      ],
      correctAnswer: "The progression of force options from presence to deadly force",
      explanation: "The use of force continuum describes escalating levels of force that may be appropriate in different situations.",
    },
    {
      questionNumber: 4,
      questionText: "Should you always try to avoid conflict when carrying a concealed weapon?",
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Conflict avoidance is crucial when armed. Your weapon is a last resort for life-threatening situations only.",
    },
    {
      questionNumber: 5,
      questionText: "Which of these is a restricted area where you CANNOT carry in Arkansas?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        "Restaurants that serve alcohol",
        "Public parks",
        "Federal buildings and courthouses",
        "Movie theaters",
      ],
      correctAnswer: "Federal buildings and courthouses",
      explanation: "Federal buildings and courthouses are prohibited locations under federal law.",
    },
    {
      questionNumber: 6,
      questionText: "Your CCW permit allows you to carry in all 50 states without restrictions.",
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "False",
      explanation: "Each state has different reciprocity agreements. You must check if your permit is recognized in other states.",
    },
    {
      questionNumber: 7,
      questionText: "What is 'brandishing'?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        "Displaying your weapon in a threatening manner",
        "A type of holster",
        "Cleaning your firearm",
        "Registering your weapon",
      ],
      correctAnswer: "Displaying your weapon in a threatening manner",
      explanation: "Brandishing is illegally displaying a weapon in a threatening manner and can result in criminal charges.",
    },
    {
      questionNumber: 8,
      questionText: "You must inform law enforcement that you're carrying when stopped for a traffic violation in Arkansas.",
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Arkansas requires permit holders to inform law enforcement that they're carrying during traffic stops.",
    },
    {
      questionNumber: 9,
      questionText: "What is the minimum age to obtain a CCW permit in Arkansas?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: ["18 years old", "21 years old", "25 years old", "16 years old with parental consent"],
      correctAnswer: "21 years old",
      explanation: "You must be at least 21 years old to obtain a concealed carry permit in Arkansas.",
    },
    {
      questionNumber: 10,
      questionText: "Situational awareness is important for CCW permit holders.",
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Being aware of your surroundings helps you avoid dangerous situations and is crucial for responsible carry.",
    },
    {
      questionNumber: 11,
      questionText: "Which of these best describes 'condition white' in the Cooper Color Code?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        "Unaware and unprepared",
        "Relaxed but alert",
        "Specific threat identified",
        "Combat ready",
      ],
      correctAnswer: "Unaware and unprepared",
      explanation: "Condition White represents being completely unaware of your surroundings - the most dangerous state.",
    },
    {
      questionNumber: 12,
      questionText: "You can drink alcohol while carrying a concealed weapon in Arkansas.",
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "False",
      explanation: "It is illegal to carry a concealed weapon while under the influence of alcohol or drugs in Arkansas.",
    },
    {
      questionNumber: 13,
      questionText: "What is 'printing' in terms of concealed carry?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        "When the outline of your weapon is visible through clothing",
        "Registering your firearm with the state",
        "Target practice at a range",
        "Filling out permit paperwork",
      ],
      correctAnswer: "When the outline of your weapon is visible through clothing",
      explanation: "Printing occurs when your concealed weapon's outline is visible, potentially exposing that you're armed.",
    },
    {
      questionNumber: 14,
      questionText: "Your Arkansas CCW permit expires after 10 years.",
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "False",
      explanation: "Arkansas CCW permits are valid for 5 years and must be renewed before expiration.",
    },
    {
      questionNumber: 15,
      questionText: "In a self-defense situation, you may use deadly force when:",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        "You reasonably believe you face imminent threat of death or serious bodily harm",
        "Someone threatens you verbally",
        "Someone trespasses on your property",
        "You feel disrespected or insulted",
      ],
      correctAnswer: "You reasonably believe you face imminent threat of death or serious bodily harm",
      explanation: "Deadly force is only justified when facing an imminent threat of death or serious bodily injury.",
    },
    {
      questionNumber: 16,
      questionText: "You should keep your firearm loaded in your vehicle at all times for quick access.",
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "False",
      explanation: "Always follow safe storage practices. An unsecured loaded firearm in a vehicle can be dangerous and may be illegal in some circumstances.",
    },
    {
      questionNumber: 17,
      questionText: "After a self-defense shooting, you should:",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        "Immediately call 911, request medical help, and briefly state you were in fear for your life",
        "Leave the scene to avoid arrest",
        "Give a detailed statement to police without an attorney",
        "Post about it on social media",
      ],
      correctAnswer: "Immediately call 911, request medical help, and briefly state you were in fear for your life",
      explanation: "Call 911 immediately, request medical assistance, provide basic facts, then request an attorney before giving a detailed statement.",
    },
    {
      questionNumber: 18,
      questionText: "Private property owners can prohibit concealed carry on their premises even if you have a permit.",
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Property owners have the right to prohibit firearms on their property, regardless of your permit status.",
    },
    {
      questionNumber: 19,
      questionText: "What is the most important factor in choosing a concealed carry holster?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        "Safety - it must cover the trigger guard completely",
        "Fashion - it must match your outfit",
        "Price - cheapest option available",
        "Brand name recognition",
      ],
      correctAnswer: "Safety - it must cover the trigger guard completely",
      explanation: "Safety is paramount. A proper holster must completely cover the trigger guard to prevent accidental discharge.",
    },
    {
      questionNumber: 20,
      questionText: "You should practice drawing and dry-firing with your concealed carry weapon regularly.",
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Regular practice with your carry weapon (safely and with proper precautions) is essential for proficiency and safety.",
    },
  ]

  for (const questionData of questions) {
    await prisma.quizQuestion.create({
      data: {
        ...questionData,
        quizId: quiz.id,
      },
    })
  }
  console.log(`✅ Created ${questions.length} quiz questions`)

  // Create a sample promo code
  await prisma.promoCode.create({
    data: {
      code: "LAUNCH50",
      discountType: "PERCENTAGE",
      discountValue: 50,
      isActive: true,
      maxUses: 100,
      usedCount: 0,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })
  console.log("✅ Promo code created: LAUNCH50 (50% off)")

  console.log("🎉 Database seeding completed!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })