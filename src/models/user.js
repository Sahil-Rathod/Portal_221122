const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      default: "__",
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      default: "__",
    },
    gender: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    github: {
      type: String,
      trim: true,
    },
    profession: {
      type: String,
      trim: true,
    },
    avatar: {
      type: Buffer,
    },
    email: {
      type: String,
      // required: true,
      trim: true,
      unique: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    password: {
      type: String,
      // required: true,
      trim: true,
      minlength: 7,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password is invalid");
        }
      },
    },
    dateOfBirth: {
      type: String,
      trim: true,
    },
    contactNo: {
      type: String,
      trim: true,
    },
    currentCity: {
      type: String,
      trim: true,
    },
    currentCountry: {
      type: String,
      trim: true,
    },
    pastCities: [
      {
        city: {
          type: String,
          trim: true,
        },
      },
    ],
    pastCountries: [
      {
        country: {
          type: String,
          trim: true,
        },
      },
    ],
    cities: [
      {
        city: {
          type: String,
          trim: true,
        },
      },
    ],
    countries: [
      {
        country: {
          type: String,
          trim: true,
        },
      },
    ],
    education: [
      {
        collegeName: {
          type: String,
          trim: true,
        },
        course: {
          type: String,
          trim: true,
        },
        fieldOfStudy: {
          type: String,
          trim: true,
        },
        yearOfPassing: {
          type: String,
          trim: true,
        },
      },
    ],
    about: {
      type: String,
      trim: true,
    },
    workExperience: [
      {
        organization: {
          type: String,
          trim: true,
        },
        position: {
          type: String,
          trim: true,
        },
        yearOfExperience: {
          type: String,
          trim: true,
        },
        startDate: {
          type: String,
          trim: true,
        },
        endDate: {
          type: String,
          trim: true,
        },
        field: {
          type: String,
          trim: true,
        },
      },
    ],
    otp: {
      type: String,
      trim: true,
    },
    emailVerify: {
      type: String,
      trime: true,
      default: false,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  // delete userObject.avatar;
  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, "umeshkishorpatel");
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Unable to login..");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login...");
  }
  return user;
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});
const User = mongoose.model("User", userSchema);
module.exports = User;
