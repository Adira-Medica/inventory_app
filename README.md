# AdiraMedica Inventory Management System

## Overview

The AdiraMedica Inventory Management System is a specialized solution designed for managing clinical trial materials (CTMs) in pharmaceutical environments. This application streamlines inventory tracking, shipment receiving, and regulatory document generation processes for AdiraMedica's operations.

## Key Functionality

### Role-Based Access Control

The system implements a hierarchical permission structure:

- **Users**: Can view inventory items and generate regulatory forms
- **Managers**: Inherit user permissions plus ability to add, edit, and archive inventory items
- **Administrators**: Full system access including user management, system settings, and audit logs

### Inventory Management

- Comprehensive tracking of clinical trial materials
- Detailed item information including storage conditions and expiry dates
- Search and filter capabilities for efficient item location
- Obsolete item marking with visual indicators for inventory control

### Receiving Operations

- Streamlined recording of shipment receipt details
- Tracking of shipping information and conditions
- Linking received items to the inventory database
- Monitoring of temperature-controlled shipments for quality assurance

### Form Generation

The system generates standardized PDF forms required for regulatory compliance:
- **Form 520B**: CTM Material Receiving Report
- **Form 519A**: Temperature Exposure Record
- **Form 501A**: CTM Inventory Record

### Administrative Functions

- User account management with approval workflow
- System settings configuration for organizational preferences
- Audit log review for compliance and security monitoring
- Statistical reporting on system usage and inventory status

## Security Features

- JWT token-based authentication system
- Role-based access control for data protection
- Comprehensive audit logging of all system activities
- User account management with activation controls

## Technical Architecture

Built using a modern technology stack featuring:
- Flask backend with RESTful API services
- React frontend providing an intuitive user interface
- PostgreSQL database for reliable data storage
- PDF generation capabilities for regulatory documentation

This system provides AdiraMedica with the tools necessary to maintain accurate inventory records, ensure regulatory compliance, and streamline clinical trial material management workflows.