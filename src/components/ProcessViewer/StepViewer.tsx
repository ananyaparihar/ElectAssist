import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, ClipboardList, Mail, MapPin } from 'lucide-react';
import './StepViewer.css';

interface ProcessStep {
  id: number;
  title: string;
  icon: React.ElementType;
  content: string;
  tips: string[];
}

const steps: ProcessStep[] = [
  {
    id: 1,
    title: 'Check Registration',
    icon: ClipboardList,
    content: 'Before voting, ensure you are registered at your current address. If you have moved recently, you may need to update your registration.',
    tips: ['Have your state ID ready', 'Check the state voter portal online']
  },
  {
    id: 2,
    title: 'Choose Voting Method',
    icon: Mail,
    content: 'Decide whether you will vote by mail, participate in early in-person voting, or vote on Election Day.',
    tips: ['Mail-in requires a request form', 'Early voting locations may differ from Election Day']
  },
  {
    id: 3,
    title: 'Find Polling Location',
    icon: MapPin,
    content: 'If voting in person, verify your designated polling location. Polling places can change between elections.',
    tips: ['Double-check hours of operation', 'Plan transportation in advance']
  }
];

const StepViewer: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const nextStep = () => {
    if (activeStep < steps.length - 1) setActiveStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (activeStep > 0) setActiveStep(prev => prev - 1);
  };

  return (
    <div className="process-container">
      <div className="process-header">
        <h2>How to Vote</h2>
        <p>A step-by-step guide to participating in the election.</p>
      </div>

      <div className="stepper-nav">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          
          return (
            <React.Fragment key={step.id}>
              <button 
                className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => setActiveStep(index)}
              >
                <div className="step-number">
                  {isCompleted ? <Check size={16} /> : index + 1}
                </div>
                <span className="step-label">{step.title}</span>
              </button>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </React.Fragment>
          );
        })}
      </div>

      <div className="step-content-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="step-card"
          >
            <div className="step-card-header">
              <div className="step-icon-container">
                {React.createElement(steps[activeStep].icon, { size: 32 })}
              </div>
              <h3>{steps[activeStep].title}</h3>
            </div>
            
            <p className="step-description">{steps[activeStep].content}</p>
            
            <div className="step-tips">
              <h4>Helpful Tips:</h4>
              <ul>
                {steps[activeStep].tips.map((tip, i) => (
                  <li key={i}>
                    <Check size={16} className="tip-icon" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="process-actions">
        <button 
          className="action-btn prev-btn" 
          onClick={prevStep}
          disabled={activeStep === 0}
        >
          <ChevronLeft size={20} />
          Previous
        </button>
        <button 
          className="action-btn next-btn" 
          onClick={nextStep}
          disabled={activeStep === steps.length - 1}
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default StepViewer;
