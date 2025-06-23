import { Timestamp } from 'firebase/firestore';

export interface MockCandidate {
  id: string;
  candidate_name: string;
  email: string;
  phone: string;
  skills: string[];
  job_role: string;
  interview_status?: 'pending' | 'scheduled' | 'completed' | 'rescheduled';
  interview_time?: { seconds: number; nanoseconds: number };
  interviewer?: string;
  feedback?: Array<{
    interviewer: string;
    rating: number;
    comments: string;
    round: number;
    selected: boolean;
  }>;
  ai_score: number;
  extracted_text: string;
  processing_success: boolean;
  education: string[];
  file_name: string;
}

export const mockCandidatesWithAI: MockCandidate[] = [
  {
    "ai_fit_score": "21",
    "email": "s.prathap08032004@gmail.com",
    "id": "9c522c38-ea8d-4c06-9b6e-89173dbeb7b7",
    "job_description": "We are looking for an experienced Senior Data Scientist to lead impactful data initiatives, design cutting-edge machine learning models, and turn complex data into actionable insights. You will work closely with cross-functional teams including engineering, product, and business stakeholders to drive data-driven decision-making and deliver value to the organization.",
    "job_id": "bbb20e20-23ea-4632-99f1-7c8c70953260",
    "job_role_name": "Senior Data Scientist",
    "name": "PRATHAP S",
    "phone_no": "+91-6383292810",
    "previous_companies": [
      {
        "name": "Emergere Technologies",
        "job_responsibilities": "Contributing to an AI-driven supply chain solution for a major U.S. construction supplier. Assisting a large-scale building materials supplier in modernizing data strategies for better decision-making.",
        "years": "Not specified"
      },
      {
        "name": "AI Armor Fusefy",
        "job_responsibilities": "Developed responsive applications using React.js and TypeScript, focusing on user experience and reusable components. Integrated APIs and built interactive UI features to enhance AI adoption tracking and compliance. Implemented security measures within the FUSE framework to fortify AI security and governance. Optimized application performance and debugged critical issues for scalable AI-based solutions.",
        "years": "Not specified"
      }
    ],
    "resume_url": "https://storage.googleapis.com/farmflow-386217.appspot.com/resumes/S.Prathap-CV.pdf?...",
    "technical_skills": "Python, C, TypeScript, JavaScript, React JS, Node JS, Vue, Html, CSS, SQL (DBMS, RDBMS), VS Code, Git, MySql, Excel, WordPress, Adobe Photoshop, AWS (IAM, VPC, EC2, S3, SQS, SNS & SES)",
    "total_experience_in_years": "Not specified",
    "years_of_experience_needed": "5-8"
  },
  {
    "ai_fit_score": "4",
    "email": "knsivasubramani@gmail.com",
    "id": "5deb21b0-0888-44f6-93ea-d5e59bf9a5e8",
    "job_description": "We are looking for an experienced Senior Data Scientist to lead impactful data initiatives, design cutting-edge machine learning models, and turn complex data into actionable insights. You will work closely with cross-functional teams including engineering, product, and business stakeholders to drive data-driven decision-making and deliver value to the organization.",
    "job_id": "bbb20e20-23ea-4632-99f1-7c8c70953260",
    "job_role_name": "Senior Data Scientist",
    "name": "SIVASUBRAMANI K N",
    "phone_no": "(+91) 7010197744",
    "previous_companies": [
      {
        "name": "Pinesphere Solutions",
        "job_responsibilities": "Developed web applications using Python Django, enhancing both back-end and front-end functionalities. Fixed bugs for existing internal applications. Documented code and development processes. Stayed updated with front-end technologies and best practices. Collaborated with a team for timely project delivery.",
        "years": "0.5"
      }
    ],
    "resume_url": "https://storage.googleapis.com/farmflow-386217.appspot.com/resumes/siva_resume.pdf?...",
    "technical_skills": "Python, Java, HTML, CSS, Bootstrap, Django, Angular, PostgreSQL, Windows, Github, Bitbucket",
    "total_experience_in_years": "0.5",
    "years_of_experience_needed": "5-8"
  },
  {
    "ai_fit_score": "20",
    "email": "rvkvigneshkumar02@gmail.com",
    "id": "b66cfd7f-e4c4-4302-9cbd-62436cac45d8",
    "job_description": "We are looking for an experienced Senior Data Scientist to lead impactful data initiatives, design cutting-edge machine learning models, and turn complex data into actionable insights. You will work closely with cross-functional teams including engineering, product, and business stakeholders to drive data-driven decision-making and deliver value to the organization.",
    "job_id": "bbb20e20-23ea-4632-99f1-7c8c70953260",
    "job_role_name": "Senior Data Scientist",
    "name": "Vignesh Kumar R",
    "phone_no": "+91-9514521819",
    "previous_companies": [
      {
        "name": "Emergere Technologies LLC",
        "job_responsibilities": "Collaborated with cross-functional teams to define and solve ML problems using LLMs and predictive analytics. Optimized few-shot prompts and embeddings to improve LLM accuracy and reduce processing time by 20%. Deployed models using Bitbucket CI/CD pipelines to AWS Lambda, enhancing system reliability and reducing deployment time by 35%. Managed real-time data updates using DynamoDB Streams for production-ready ML pipelines.",
        "years": "2024 – Present"
      },
      {
        "name": "GE Vernova",
        "job_responsibilities": "Developed AI-based automation for processing purchase orders, reducing manual effort by 40%. Worked on secure Azure AD integration and automated Excel-interface pipelines in Microsoft Dynamics ERP. Improved data handling speed by 35% through workflow automation for the purchase order system.",
        "years": "Jan 2024 – Jun 2024"
      }
    ],
    "resume_url": "https://storage.googleapis.com/farmflow-386217.appspot.com/resumes/Vignesh_Kumar_Resume_Machine_Learning_Scientisst.pdf?...",
    "technical_skills": "Python, SQL, Scikit-learn, PyTorch, TensorFlow, HuggingFace, AWS (Lambda, DynamoDB, S3, ECS, ECR), Azure (OpenAI, Fabric), Bitbucket Pipelines, Docker, Git, Streamlit, FastAPI, Pandas, NumPy, Tesseract OCR, Prompt Engineering, Supervised/Unsupervised Learning, Deep Learning, Feature Engineering, Model Evaluation",
    "total_experience_in_years": "Less than 1 year",
    "years_of_experience_needed": "5-8"
  }
]

