// utils/chatAssistant.js

export const chatRules = {
  // Login related questions
  login: {
    keywords: ['login', 'sign in', 'log in', 'cannot login', 'can\'t login', 'unable to login', 'login failed'],
    responses: [
      "To login, please use your registered email and password. If you've forgotten your password, click 'Forgot Password' on the login page.",
      "Make sure you're using the correct email address and password. Passwords are case-sensitive.",
      "If you're having trouble logging in, try clearing your browser cache or resetting your password."
    ]
  },
  password: {
    keywords: ['password', 'forgot password', 'reset password', 'change password', 'update password'],
    responses: [
      "You can reset your password by clicking 'Forgot Password' on the login page. We'll send a reset link to your email.",
      "To change your password, go to Settings → Security → Change Password. Make sure your new password is at least 8 characters.",
      "If you've forgotten your password, please use the password reset feature. Contact your school admin if you need further assistance."
    ]
  },
  account: {
    keywords: ['account', 'my account', 'account settings', 'profile', 'update profile'],
    responses: [
      "You can manage your account settings by clicking your profile picture in the top right corner and selecting 'My Profile'.",
      "To update your email or personal information, go to Settings → Profile Information.",
      "Your account security is important. Enable two-factor authentication in Security Settings for extra protection."
    ]
  },

  // School related questions
  classes: {
    keywords: ['class', 'classes', 'schedule', 'timetable', 'my classes', 'class schedule'],
    responses: [
      "You can view your class schedule in the Dashboard → My Classes section. All your enrolled classes and timings are listed there.",
      "To join a virtual class, click on the 'Join Class' button next to your scheduled class time.",
      "Your class schedule is automatically updated by your school admin. Check daily for any changes or announcements."
    ]
  },
  assignment: {
    keywords: ['assignment', 'homework', 'submit', 'upload', 'due date', 'deadline'],
    responses: [
      "You can find all your assignments in the Assignments section. Click on any assignment to view details and submit your work.",
      "Make sure to submit assignments before the due date. Late submissions may incur penalties as per your school policy.",
      "For assignment submissions, supported file formats include PDF, DOC, DOCX, and images. Maximum file size is 10MB."
    ]
  },
  grades: {
    keywords: ['grade', 'grades', 'result', 'marks', 'score', 'performance', 'report card'],
    responses: [
      "Your grades are available in the Grades section. You can view your performance by subject, term, or academic year.",
      "For detailed grade breakdowns and teacher feedback, click on any subject grade to see individual assignment scores.",
      "If you have questions about specific grades, please contact your subject teacher directly through the platform."
    ]
  },
  attendance: {
    keywords: ['attendance', 'present', 'absent', 'leave', 'attendance record'],
    responses: [
      "Your attendance records can be viewed in the Attendance section. You can see daily, monthly, and yearly attendance statistics.",
      "To report an absence, please inform your class teacher or use the Leave Request feature under Attendance.",
      "Attendance is marked by teachers for each class. Contact your teacher if you notice any discrepancies."
    ]
  },
  exam: {
    keywords: ['exam', 'test', 'quiz', 'assessment', 'final exam', 'midterm'],
    responses: [
      "Exam schedules and results are available in the Examinations section. You can also download your exam hall ticket from there.",
      "Prepare for exams using our study materials in the Resources section. Previous year papers are also available.",
      "For exam-related queries, please refer to the examination guidelines or contact the examination department."
    ]
  },
  fee: {
    keywords: ['fee', 'payment', 'tuition', 'due', 'invoice', 'bill', 'pay'],
    responses: [
      "You can view and pay fees in the Payments section. Check your due amount and payment history there.",
      "Fees can be paid online via credit card, debit card, or net banking. An invoice will be generated after successful payment.",
      "For fee concessions or scholarships, please contact the accounts department with supporting documents."
    ]
  },
  teacher: {
    keywords: ['teacher', 'instructor', 'professor', 'communication', 'contact teacher'],
    responses: [
      "You can message your teachers directly through the Messages feature. Go to Messages → New Message and select the teacher's name.",
      "Each class has a dedicated teacher. Their contact information and office hours are listed on the class page.",
      "Teachers usually respond within 24 hours. For urgent matters, please contact the school office directly."
    ]
  },
  resource: {
    keywords: ['resource', 'material', 'study material', 'notes', 'books', 'download'],
    responses: [
      "Learning resources are available in the Resources section. You can find notes, presentations, videos, and reference materials there.",
      "Search for specific topics using the search bar in Resources. Materials are organized by subject and grade level.",
      "Teachers regularly upload new study materials. Enable notifications to stay updated about new resources."
    ]
  },
  event: {
    keywords: ['event', 'activity', 'workshop', 'seminar', 'competition', 'cultural'],
    responses: [
      "Upcoming school events are listed in the Events section. Click on any event to register or view details.",
      "Important dates like parent-teacher meetings, holidays, and exams are marked on the academic calendar.",
      "Subscribe to event notifications to never miss important school activities and deadlines."
    ]
  },
  library: {
    keywords: ['library', 'book', 'borrow', 'return', 'catalog'],
    responses: [
      "Access the digital library from the Library section. You can search for books, check availability, and place reservations.",
      "To borrow a book, search for it in the catalog and click 'Borrow'. Books can be kept for 14 days.",
      "Return borrowed books through the library portal or at the physical library. Late returns may incur fines."
    ]
  },
  technical: {
    keywords: ['technical', 'bug', 'error', 'not working', 'issue', 'problem', 'crash'],
    responses: [
      "For technical issues, first try refreshing the page or clearing your browser cache. If the problem persists, contact our technical support.",
      "Report bugs through the 'Report an Issue' button. Please provide screenshots and steps to reproduce the problem.",
      "We support latest versions of Chrome, Firefox, Safari, and Edge. Ensure your browser is updated for the best experience."
    ]
  }
};

// Main function to process user message and return response
export const getChatResponse = (userMessage) => {
  const message = userMessage.toLowerCase().trim();
  
  // Check each rule category
  for (const [category, rule] of Object.entries(chatRules)) {
    const matched = rule.keywords.some(keyword => message.includes(keyword));
    if (matched) {
      // Return a random response from the matching category
      const randomIndex = Math.floor(Math.random() * rule.responses.length);
      return rule.responses[randomIndex];
    }
  }
  
  // Default response for unmatched queries
  const defaultResponses = [
    "I'm here to help with login and school-related questions! Could you please provide more details about your issue?",
    "I can assist you with login problems, classes, assignments, grades, attendance, exams, and more. What specific information do you need?",
    "Feel free to ask me about any school-related topics like schedules, assignments, grades, or technical support. How can I assist you today?"
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// Get quick reply suggestions based on context
export const getQuickSuggestions = () => {
  return [
    "How do I reset my password?",
    "View my class schedule",
    "Submit an assignment",
    "Check my grades",
    "Report an attendance issue",
    "Pay school fees",
    "Contact my teacher",
    "Technical support"
  ];
};