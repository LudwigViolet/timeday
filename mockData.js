// ==================== 模拟数据 ====================

/**
 * 学科数据结构
 * 后端数据库表结构参考：
 * subjects表：id, name, icon, created_at, updated_at
 * topics表：id, subject_id, name, code, papers_count, last_updated
 * papers表：id, topic_id, title, year, session, paper_number, file_path
 */
export const subjectsData = {
  mathematics: {
    name: 'Mathematics',
    icon: '📐',
    topics: [
      { id: '9709', name: 'A Level Mathematics', papers: 178, lastUpdated: '2024-01-14' },
      { id: '0580', name: 'IGCSE Mathematics', papers: 267, lastUpdated: '2024-01-09' },
      { id: '4MA1', name: 'Edexcel A Level Mathematics', papers: 145, lastUpdated: '2024-01-12' }
    ]
  },
  physics: {
    name: 'Physics',
    icon: '⚛️',
    topics: [
      { id: '9702', name: 'A Level Physics', papers: 156, lastUpdated: '2024-01-15' },
      { id: '0625', name: 'IGCSE Physics', papers: 234, lastUpdated: '2024-01-10' },
      { id: '9PH0', name: 'Edexcel A Level Physics', papers: 142, lastUpdated: '2024-01-13' }
    ]
  },
  computerscience: {
    name: 'Computer Science',
    icon: '💻',
    topics: [
      { id: '9618', name: 'A Level Computer Science', papers: 89, lastUpdated: '2024-01-16' },
      { id: '0478', name: 'IGCSE Computer Science', papers: 156, lastUpdated: '2024-01-08' },
      { id: '9CP0', name: 'Edexcel A Level Computer Science', papers: 78, lastUpdated: '2024-01-11' }
    ]
  },
  furthermathematics: {
    name: 'Further Mathematics',
    icon: '🔢',
    topics: [
      { id: '9231', name: 'A Level Further Mathematics', papers: 134, lastUpdated: '2024-01-17' },
      { id: '0606', name: 'IGCSE Additional Mathematics', papers: 98, lastUpdated: '2024-01-09' },
      { id: '9FM0', name: 'Edexcel A Level Further Mathematics', papers: 112, lastUpdated: '2024-01-14' }
    ]
  },
  chemistry: {
    name: 'Chemistry',
    icon: '🧪',
    topics: [
      { id: '9701', name: 'A Level Chemistry', papers: 142, lastUpdated: '2024-01-12' },
      { id: '0620', name: 'IGCSE Chemistry', papers: 198, lastUpdated: '2024-01-08' },
      { id: '9CH0', name: 'Edexcel A Level Chemistry', papers: 134, lastUpdated: '2024-01-10' }
    ]
  },
  biology: {
    name: 'Biology',
    icon: '🧬',
    topics: [
      { id: '9700', name: 'A Level Biology', papers: 134, lastUpdated: '2024-01-11' },
      { id: '0610', name: 'IGCSE Biology', papers: 189, lastUpdated: '2024-01-07' },
      { id: '9BI0', name: 'Edexcel A Level Biology', papers: 123, lastUpdated: '2024-01-09' }
    ]
  },
  business: {
    name: 'Business Studies',
    icon: '💼',
    topics: [
      { id: '9609', name: 'A Level Business', papers: 98, lastUpdated: '2024-01-15' },
      { id: '0450', name: 'IGCSE Business Studies', papers: 145, lastUpdated: '2024-01-06' },
      { id: '9BS0', name: 'Edexcel A Level Business', papers: 87, lastUpdated: '2024-01-12' }
    ]
  },
  english: {
    name: 'English',
    icon: '📖',
    topics: [
      { id: '9093', name: 'A Level English Language', papers: 98, lastUpdated: '2024-01-13' },
      { id: '0500', name: 'IGCSE First Language English', papers: 156, lastUpdated: '2024-01-06' },
      { id: '9ET0', name: 'Edexcel A Level English Literature', papers: 89, lastUpdated: '2024-01-11' }
    ]
  },
  history: {
    name: 'History',
    icon: '📜',
    topics: [
      { id: '9489', name: 'A Level History', papers: 112, lastUpdated: '2024-01-14' },
      { id: '0470', name: 'IGCSE History', papers: 134, lastUpdated: '2024-01-07' },
      { id: '9HI0', name: 'Edexcel A Level History', papers: 98, lastUpdated: '2024-01-10' }
    ]
  }
};

/**
 * 用户测试数据
 * 后端数据库表结构参考：
 * user_textbooks表：id, user_id, title, subject, file_path
 * user_syllabuses表：id, user_id, title, subject, year, level, file_path
 * user_notebooks表：id, user_id, title, subject, pages, content
 */
export const userTestData = {
  textBooks: [
    // Physics Textbooks
    { id: 1, title: 'Cambridge IGCSE Physics Coursebook', subject: 'Physics', level: 'IGCSE', author: 'David Sang', publisher: 'Cambridge University Press', year: '2023', description: 'Comprehensive coursebook covering all IGCSE Physics topics with practical activities and exam preparation.' },
    { id: 2, title: 'Cambridge International AS & A Level Physics Coursebook', subject: 'Physics', level: 'A Level', author: 'David Sang', publisher: 'Cambridge University Press', year: '2023', description: 'Complete coverage of AS and A Level Physics with worked examples and practice questions.' },
    
    // Mathematics Textbooks
    { id: 3, title: 'Cambridge IGCSE Mathematics Core and Extended Coursebook', subject: 'Mathematics', level: 'IGCSE', author: 'Karen Morrison', publisher: 'Cambridge University Press', year: '2023', description: 'Covers both Core and Extended curriculum with step-by-step explanations and exercises.' },
    { id: 4, title: 'Cambridge International AS & A Level Mathematics Pure Mathematics 1', subject: 'Mathematics', level: 'A Level', author: 'Hugh Neill', publisher: 'Cambridge University Press', year: '2023', description: 'Pure Mathematics 1 coursebook with comprehensive coverage of algebraic and calculus topics.' },
    
    // Chemistry Textbooks
    { id: 5, title: 'Cambridge IGCSE Chemistry Coursebook', subject: 'Chemistry', level: 'IGCSE', author: 'Richard Harwood', publisher: 'Cambridge University Press', year: '2023', description: 'Complete IGCSE Chemistry course with practical investigations and exam techniques.' },
    { id: 6, title: 'Cambridge International AS & A Level Chemistry Coursebook', subject: 'Chemistry', level: 'A Level', author: 'Lawrie Ryan', publisher: 'Cambridge University Press', year: '2023', description: 'Comprehensive A Level Chemistry with detailed explanations and real-world applications.' },
    
    // Biology Textbooks
    { id: 7, title: 'Cambridge IGCSE Biology Coursebook', subject: 'Biology', level: 'IGCSE', author: 'Mary Jones', publisher: 'Cambridge University Press', year: '2023', description: 'Complete IGCSE Biology coverage with practical work and assessment guidance.' },
    { id: 8, title: 'Cambridge International AS & A Level Biology Coursebook', subject: 'Biology', level: 'A Level', author: 'Mary Jones', publisher: 'Cambridge University Press', year: '2023', description: 'Comprehensive A Level Biology with detailed biological processes and modern applications.' }
  ],
  syllabuses: [
    { id: 1, title: 'Cambridge International AS & A Level Physics', subject: 'Physics', year: '2025-2027', level: 'A Level', code: '9702' },
    { id: 2, title: 'Cambridge IGCSE Physics', subject: 'Physics', year: '2024-2026', level: 'IGCSE', code: '0625' },
    { id: 3, title: 'Cambridge International AS & A Level Mathematics', subject: 'Mathematics', year: '2025-2027', level: 'A Level', code: '9709' },
    { id: 4, title: 'Cambridge IGCSE Mathematics', subject: 'Mathematics', year: '2024-2026', level: 'IGCSE', code: '0580' },
    { id: 5, title: 'Cambridge International AS & A Level Chemistry', subject: 'Chemistry', year: '2025-2027', level: 'A Level', code: '9701' },
    { id: 6, title: 'Cambridge IGCSE Chemistry', subject: 'Chemistry', year: '2024-2026', level: 'IGCSE', code: '0620' },
    { id: 7, title: 'Cambridge International AS & A Level Biology', subject: 'Biology', year: '2025-2027', level: 'A Level', code: '9700' },
    { id: 8, title: 'Cambridge IGCSE Biology', subject: 'Biology', year: '2024-2026', level: 'IGCSE', code: '0610' }
  ],
  notebooks: [
    { 
      id: 1, 
      title: 'Physics Lab Notes', 
      subject: 'Physics', 
      content: '# Physics Lab Notes\n\n## Experiment 1: Pendulum Motion\n\nToday we studied the motion of a simple pendulum...\n\n### Observations\n- Period increases with length\n- Mass does not affect period\n\n### Formula\n$$T = 2\\pi\\sqrt{\\frac{L}{g}}$$',
      tags: ['physics', 'lab', 'pendulum'],
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      folder: 'Physics'
    },
    { 
      id: 2, 
      title: 'Calculus Integration Methods', 
      subject: 'Mathematics', 
      content: '# Integration Methods\n\n## By Parts\nUseful for products of functions:\n$$\\int u \\, dv = uv - \\int v \\, du$$\n\n## Substitution\nFor composite functions...\n\n## Partial Fractions\nFor rational functions...',
      tags: ['mathematics', 'calculus', 'integration'],
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      folder: 'Mathematics'
    },
    { 
      id: 3, 
      title: 'Organic Chemistry Reactions', 
      subject: 'Chemistry', 
      content: '# Organic Chemistry Reactions\n\n## Substitution Reactions\n\n### SN1 Mechanism\n- Carbocation intermediate\n- Rate depends on substrate concentration\n\n### SN2 Mechanism\n- Concerted mechanism\n- Inversion of configuration',
      tags: ['chemistry', 'organic', 'reactions'],
      createdAt: '2024-01-12',
      updatedAt: '2024-01-19',
      folder: 'Chemistry'
    },
    { 
      id: 4, 
      title: 'Cell Biology Overview', 
      subject: 'Biology', 
      content: '# Cell Biology\n\n## Cell Structure\n\n### Prokaryotes\n- No nucleus\n- DNA in nucleoid region\n\n### Eukaryotes\n- Membrane-bound nucleus\n- Organelles present\n\n## Cell Division\n- Mitosis: somatic cells\n- Meiosis: gametes',
      tags: ['biology', 'cell', 'structure'],
      createdAt: '2024-01-08',
      updatedAt: '2024-01-16',
      folder: 'Biology'
    },
    { 
      id: 5, 
      title: 'Study Plan - Final Exams', 
      subject: 'General', 
      content: '# Final Exam Study Plan\n\n## Week 1\n- [ ] Review Physics formulas\n- [ ] Practice calculus problems\n- [ ] Chemistry reaction mechanisms\n\n## Week 2\n- [ ] Biology diagrams\n- [ ] Past papers\n- [ ] Group study sessions',
      tags: ['study-plan', 'exams', 'schedule'],
      createdAt: '2024-01-05',
      updatedAt: '2024-01-21',
      folder: 'Planning'
    }
  ]
};