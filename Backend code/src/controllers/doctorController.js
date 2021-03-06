const DoctorModel = require("../models/doctorModel");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const HttpException = require("../utils/HttpException");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

class DoctorController {

  userLogin = async (req, res, next) => {
    this.checkValidation(req);

    const { username, password:pass } = req.body;
    const user = await DoctorModel.findOne({ username });
    if (!user) {
      throw new HttpException(401, "Unable to login!");
    }
    
    //Checking decripted password with encripted password which user write in input
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new HttpException(401, "Incorrect password!");
    }

    // user matched!
    const secretKey = process.env.SECRET_JWT || "";
    const token = jwt.sign({ user_id: user.doctor_id.toString() }, secretKey, {
      expiresIn: "24h",
    });

    //Odvojimo password od ostlaih property-a user-a
    //ID ne mozemo zbg lakseg updatovanja doktora
    const { password, ...userWithoutPassword } = user;
    //Sad na ostale property-a user-a kao jedan objekat dodamo
    //token i posaljemo ga kao res
    //Ne zelimo da password bude vidljiv
    res.send({ ...userWithoutPassword, token });
  };

  createUser = async (req, res, next) => {
      this.checkValidation(req);
      
      await this.hashPassword(req);

      const result = await DoctorModel.create(req.body);
      if (!result) {
        throw new HttpException(500, "Something went wrong");
      }
  
      res.status(201).send("User was created!");
  }

  updateUser = async (req, res, next) => {
   
    this.checkValidation(req);

    await this.hashPassword(req);

    // do the update query and get the result
    const result = await DoctorModel.update(req.body, req.params.id);

    if (!result) {
      throw new HttpException(404, "Something went wrong");
    }

    const { affectedRows, changedRows, info } = result;

    const message = !affectedRows
      ? "User not found"
      : affectedRows && changedRows
      ? "User updated successfully"
      : "Updated faild";

    res.send({ message, info });
  };

  checkValidation = (req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpException(400, "Patient validation faild", errors);
    }
  };

  // hash password if it exists
  hashPassword = async (req) => {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 8);
    }
  };
}

/******************************************************************************
 *                               Export
 ******************************************************************************/
 module.exports = new DoctorController();
