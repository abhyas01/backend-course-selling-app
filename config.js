const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const z = require('zod');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;
const JWT_SECRET_USER = process.env.JWT_SECRET_USER;
const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN;
const JWT_EXPIRY_USER = process.env.JWT_EXPIRY_USER;
const JWT_EXPIRY_ADMIN = process.env.JWT_EXPIRY_ADMIN;

module.exports = {
  express,
  jwt,
  mongoose,
  z,
  cors,
  MONGO_URL,
  JWT_SECRET_USER,
  JWT_SECRET_ADMIN,
  JWT_EXPIRY_USER,
  JWT_EXPIRY_ADMIN,
  bcrypt
};