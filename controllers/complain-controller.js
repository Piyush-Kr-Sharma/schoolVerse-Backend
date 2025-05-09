const Complain = require("../models/complainSchema.js");

const complainCreate = async (req, res) => {
  try {
    const complain = new Complain(req.body);
    const result = await complain.save();
    res.send(result);
  } catch (err) {
    res.status(500).json(err);
  }
};

const complainList = async (req, res) => {
  try {
    let complains = await Complain.find({ school: req.params.id }).populate(
      "user",
      "name"
    );
    // ek school ke saare complaints find karega and then user field ko populate karega jo ki student
    // collection ka reference deta hai aur wo student ke name ko populate karega
    if (complains.length > 0) {
      res.send(complains);
    } else {
      res.send({ message: "No complains found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = { complainCreate, complainList };
