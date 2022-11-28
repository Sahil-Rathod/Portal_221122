const express = require("express");
const Feed = require("../models/feed");
const User = require("../models/user");
const auth = require("../middleware/auth");
const nodemailer = require("nodemailer");
const multer = require("multer");
const sharp = require("sharp");
const router = new express.Router();

// const sendMail = async (mail, otp) => {
//   const msg = {
//     from: "alumni@jspmrscoe.edu.in",
//     to: mail,
//     subject: "one time password",
//     text: `Your one time password for the alumni portal is ${otp}`,
//   };
//   nodemailer
//     .createTransport({
//       service: "gmail",
//       auth: {
//         user: "alumni@jspmrscoe.edu.in",
//         pass: "password",
//       },
//       port: 465,
//       host: "smtp.gmail.com",
//     })
//     .sendMail(msg, (err) => {
//       if (err) {
//         return new Error("Error occure");
//       } else {
//         return;
//       }
//     });
// };

router.post("/users", async (req, res) => {
  const email = req.body.email;
  const user1 = await User.findOne({ email });
  if (user1 !== undefined && user1 !== null) {
    if (user1.emailVerify === false || user1.emailVerify === "false") {
      await User.deleteOne({ email });
    }
  }
  const user = new User(req.body);
  // const otp = Math.floor(1000 + Math.random() * 9000);
  //user.otp = otp;
  try {
    await user.save();
    // await sendMail(user.email, otp);

    res.status(201).send({ user });
  } catch (error) {
    // console.log("Failed");
    res.status(401).send(error);
  }
});
// router.post("/users/verifyEmail", async (req, res) => {
//   const email = req.body.email;
//   //  const otp = req.body.otp;
//   const user = await User.findOne({ email });
//   if (!user) {
//     throw new Error(`Invalid email`);
//   }

//   try {
//     // if (Number(otp) != Number(user.otp)) {
//     //   throw new Error(`OTP not match`);
//     // }
//     user.emailVerify = true;
//     await user.save();
//     const token = await user.generateAuthToken();
//     res.status(201).send({ user, token });
//   } catch (error) {
//     console.log(error);
//     res.status(400).send(error);
//   }
// });

// router.post("/users/login", async (req, res) => {
//   try {
//     const user = await User.findByCredentials(
//       req.body.email,
//       req.body.password
//     );
//     const token = await user.generateAuthToken();
//     res.send({ user, token });
//   } catch (e) {
//     console.log(e);
//     res.status(400).send();
//   }
// });

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    // if (user.emailVerify === false || user.emailVerify === "false") {
    //   throw new Error("Invalide user4545454544");
    // }
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    console.log(e);
    // res.status(400).send();
  }
  // try {
  //   const { email, password } = req.body;
  //   if (!email || !password) {
  //     return res.status(400).json({ message: "Invalid Credentials" });
  //   }
  //   const userLogin = await User.findOne({ email, password });
  //   console.log(userLogin);
  // } catch (e) {
  //   console.log(e);
  // }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token != req.token;
    });
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.get("/users/getUser", auth, async (req, res) => {
  const _id = req.query.id;
  const data = await User.findById(_id);
  res.send(data);
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  console.log(req.body);
  const allowedUpdates = [
    "firstName",
    "lastName",
    "profession",
    "email",
    "password",
    "linkedin",
    "github",
    "contactNo",
    "gender",
    "currentCity",
    "currentCountry",
    "pastCities",
    "pastCountries",
    "education",
    "collegeName",
    "course:",
    "yearOfPassing",
    "dateOfBirth",
    "about",
    "workExperience",
  ];
  const isValid = updates.every((update) => {
    return allowedUpdates.includes(update);
  });
  if (!isValid) {
    return res.status(400).send({ error: "Invalid Update" });
  }
  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    if (req.user.gender) {
      req.user.gender = req.user.gender.toLowerCase();
    }
    req.user.cities = [];
    req.user.countries = [];
    if (req.user.currentCity) {
      req.user.cities.push({ city: req.user.currentCity });
    }
    if (req.user.currentCountry) {
      req.user.countries.push({ country: req.user.currentCountry });
    }
    if (req.user.pastCities) {
      req.user.cities = [...req.user.cities, ...req.user.pastCities];
    }
    if (req.user.pastCountries) {
      req.user.countries = [...req.user.countries, ...req.user.pastCountries];
    }
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

const upload = multer({
  // limits: {
  // fileSize: 1000000
  // },
  fileFilter(req, file, cb) {
    if (
      !file.originalname.match(/\.(apng|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)$/)
    ) {
      return cb(new Error("Please upload image"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.get("/users/me/avatar", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.post("/users/me/findAlumni", auth, async (req, res) => {
  try {
    let user;
    let data = { ...req.query };
    let page = data.page;
    delete data.page;
    if (!page) {
      page = 1;
    }
    let size = 5;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    if (data.words) {
      console.log(data.words);
      if (Array.isArray(data.words)) {
        data.firstName = [...data.words];
        data.lastName = [...data.words];
        delete data.words;
        // console.log("🔥🔥", data);
        data.firstName = data.firstName.map((e) => {
          return new RegExp(e, "i");
        });
        data.lastName = data.lastName.map((e) => {
          return new RegExp(e, "i");
        });
      } else {
        data.firstName = new RegExp(data.words, "i");
        data.lastName = new RegExp(data.words, "i");
        delete data.words;
      }

      user = await User.find({
        $or: [{ firstName: data.firstName }, { lastName: data.lastName }],
      })
        .limit(limit)
        .skip(skip);

      if (!user) {
        throw new Error();
      }
    } else {
      for (let [key, value] of Object.entries(data)) {
        if (key === "gender") {
          continue;
        }
        data[key] = new RegExp(value, "i");
      }

      user = await User.find(data).limit(limit).skip(skip);

      if (!user) {
        throw new Error();
      }
    }

    res.send(user);
  } catch (e) {
    console.log(e);
    res.status(404).send();
  }
});

// const sendMail = async (mail, otp) => {
//   const msg = {
//     from: "alumni@jspmrscoe.edu.in",
//     to: mail,
//     subject: "Reset Password",
//     text: `Your one time password for the alumni portal is ${otp}

// 		Please do not respond to this mail.

// 	`,
//   };
//   nodemailer
//     .createTransport({
//       service: "gmail",
//       auth: {
//         user: "alumni@jspmrscoe.edu.in",
//         pass: "kgrntjlihelgnepn",
//       },
//       port: 465,
//       host: "smtp.gmail.com",
//     })
//     .sendMail(msg, (err) => {
//       if (err) {
//         return new Error("Error occure");
//       } else {
//         return;
//       }
//     });
// };

// router.post("/users/forgetPassword", async (req, res) => {
//   try {
//     const email = req.body.email;
//     const user = await User.findOne({ email }).select({ email: 1 });
//     if (!user) {
//       throw new Error(`Invalid email`);
//     }
//     const otp = Math.floor(1000 + Math.random() * 9000);
//     sendMail(email, otp)
//       .then(() => {
//         user.otp = otp;
//       })
//       .catch(() => {
//         throw new Error(`Errore occure`);
//       });

//     await user.save();
//     res.send({ message: `user is valid` });
//   } catch (e) {
//     // console.log(e.message);
//     res.status(400).send({ message: e.message });
//   }
// });

// router.post("/users/verifyOTP", async (req, res) => {
//   try {
//     const email = req.body.email;
//     const otp = req.body.otp;
//     const user = await User.findOne({ email }).select({
//       email: 1,
//       otp: 1,
//       tokens: 1,
//     });
//     if (!user) {
//       throw new Error(`Invalid email`);
//     }
//     if (Number(otp) != Number(user.otp)) {
//       throw new Error(`OTP not match`);
//     }
//     const token = await user.generateAuthToken();
//     res.send({ message: `OTP Match`, token });
//   } catch (e) {
//     // console.log(e.message);
//     res.status(400).send({ message: e.message });
//   }
// });

router.delete("/users/me", auth, async (req, res) => {
  try {
    const data = await Feed.deleteMany({ owner: req.user._id });
    await req.user.remove();
    res.send(req.user);
  } catch (error) {
    console.log();
    res.status(500).send(error);
  }
});

module.exports = router;
