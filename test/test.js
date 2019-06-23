"use strict";
//setup test framework
const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

//testee
const getImage = require("../lib/index.js");

describe("test for aws internal functions", function() {
  this.timeout(30000); //eslint-disable-line no-invalid-this
  describe("check latest machine image", ()=>{
    [
      { region: "ap-northeast-1", os: "centos7", ImageID: "ami-045f38c93733dd48d" },
      { region: "ap-northeast-1", os: "centos6", ImageID: "ami-02eb8e0986956e8d6" },
      { region: "ap-northeast-1", os: "ubuntu18", ImageID: "ami-032cf5e284518543d" },
      { region: "ap-northeast-1", os: "ubuntu16", ImageID: "ami-0187a903e08b8fd23" },
      { region: "ap-northeast-1", os: "rhel7", ImageID: "ami-0e3e6ca71a19ccf06" },
      { region: "ap-northeast-1", os: "rhel6", ImageID: "ami-07db7474f01e1ec62" }
    ].forEach((e)=>{
      it(`should return latest lmage ID of ${e.os}`, async()=>{
        const image = await getImage(e.os, e.region);
        expect(image.ImageId, JSON.stringify(image, null, 2)).to.be.equal(e.ImageID);
      });
    });
  });
  describe("error case", ()=>{
    const stub = sinon.stub();
    [
      "UBUNTU16",
      "UBUNTU18",
      "ubuntu 16",
      "ubuntu bionic",
      "CentOS7",
      "centos",
      "centos5",
      undefined, //eslint-disable-line no-undefined
      null,
      42,
      {},
      stub
    ].forEach((os)=>{
      it("should be rejected for invaild os keyword", ()=>{
        expect(getImage(os, "ap-northeast-1")).to.be.rejected;
        expect(stub).not.to.be.called;
      });
    });
    it("should be rejected if region is not specified", ()=>{
      expect(getImage("centos7")).to.be.rejected;
    });
  });
});
