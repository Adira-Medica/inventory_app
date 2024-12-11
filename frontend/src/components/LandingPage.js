// src/components/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  ClipboardDocumentListIcon, 
  PlusCircleIcon, 
  DocumentDuplicateIcon 
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Add Data",
      description: "Add new items or receiving data",
      icon: PlusCircleIcon,
      path: "/add-data",
      color: "bg-emerald-500"
    },
    {
      title: "Data Management",
      description: "Manage inventory items and receiving data",
      icon: ClipboardDocumentListIcon,
      path: "/edit-data",
      color: "bg-blue-500"
    },
    {
      title: "Form 520B",
      description: "Generate and manage 520B forms",
      icon: DocumentTextIcon,
      path: "/forms/520b",
      color: "bg-purple-500"
    },
    {
      title: "Form 501A",
      description: "Generate and manage 501A forms",
      icon: DocumentDuplicateIcon,
      path: "/forms/501a",
      color: "bg-indigo-500"
    },
    {
      title: "Form 519A",
      description: "Generate and manage 519A forms",
      icon: DocumentTextIcon,
      path: "/forms/519a",
      color: "bg-pink-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: { 
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { 
      scale: 0.98 
    }
  };

  const iconVariants = {
    hover: {
      rotate: [0, -10, 10, -10, 0],
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            AdiraMedica Inventory System
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600"
          >
            Manage your inventory and generate forms efficiently
          </motion.p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => navigate(card.path)}
              className="cursor-pointer"
            >
              <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
                <div className={`${card.color} absolute top-0 left-0 w-2 h-full`} />
                <div className="p-6">
                  <motion.div 
                    variants={iconVariants}
                    className={`${card.color} inline-block p-3 rounded-lg text-white mb-4`}
                  >
                    <card.icon className="h-6 w-6" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {card.title}
                  </h2>
                  <p className="text-gray-600">
                    {card.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LandingPage;