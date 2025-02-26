// src/components/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  DocumentDuplicateIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleCardClick = (path) => {
    navigate(path);
  };

  // Define cards based on user role
  let cards = [
    {
      title: "View Data",
      description: "View inventory items and receiving data",
      icon: EyeIcon, // Make sure to import this
      path: "/view-data",
      color: "bg-teal-500",
      minRole: "user" // All roles can access this
    },
    {
      title: "Form 520B",
      description: "Generate and manage 520B forms",
      icon: DocumentTextIcon,
      path: "/forms/520b",
      color: "bg-purple-500",
      minRole: "user" // All roles can access this
    },
    {
      title: "Form 501A",
      description: "Generate and manage 501A forms",
      icon: DocumentDuplicateIcon,
      path: "/forms/501a",
      color: "bg-indigo-500",
      minRole: "user" // All roles can access this
    },
    {
      title: "Form 519A",
      description: "Generate and manage 519A forms",
      icon: DocumentTextIcon,
      path: "/forms/519a",
      color: "bg-pink-500",
      minRole: "user" // All roles can access this
    }
  ];

  // Add manager-specific cards
  if (user?.role === 'manager' || user?.role === 'admin') {
    cards = [
      ...cards,
      {
        title: "Add Data",
        description: "Add new items or receiving data",
        icon: PlusCircleIcon,
        path: "/add-data",
        color: "bg-emerald-500",
        minRole: "manager"
      },
      {
        title: "Data Management",
        description: "Manage inventory items and receiving data",
        icon: ClipboardDocumentListIcon,
        path: "/edit-data",
        color: "bg-blue-500",
        minRole: "manager"
      },
    ];
  }

  // Add admin-specific card
  if (user?.role === 'admin') {
    cards.push({
      title: "Admin Dashboard",
      description: "Manage users, system settings and view logs",
      icon: CogIcon,
      path: "/admin",
      color: "bg-red-500",
      minRole: "admin"
    });
  }

  // Sort cards by title
  cards.sort((a, b) => a.title.localeCompare(b.title));

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
      {/* Header with Logout Button */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">AdiraMedica</h1>
            {user && (
              <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                {user.role}
              </span>
            )}
          </div>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Logout
          </motion.button>
        </div>
      </header>
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
            Inventory Management System
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600"
          >
            Welcome, {user?.username}! Access the features below based on your role permissions.
          </motion.p>
        </motion.div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {cards.map((card) => (
            <motion.div
              key={card.title}
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              className="cursor-pointer"
              onClick={() => handleCardClick(card.path)}
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