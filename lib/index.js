"use strict";
const AWS = require("aws-sdk");
const debug = require("debug")("get-ami");

const osFilters = {
  ubuntu16: [{
    Name: "name",
    Values: [
      "ubuntu/images/hvm-ssd/ubuntu-xenial*"
    ]
  },
  {
    Name: "owner-id",
    Values: [
      "099720109477"
    ]
  }
  ],
  ubuntu18: [
    {
      Name: "name",
      Values: [
        "ubuntu/images/hvm-ssd/ubuntu-bionic*"
      ]
    },
    {
      Name: "owner-id",
      Values: [
        "099720109477"
      ]
    }
  ],
  centos6: [
    {
      Name: "name",
      Values: [
        "CentOS Linux 6*"
      ]
    },
    {
      Name: "owner-id",
      Values: [
        "679593333241"
      ]
    }
  ],
  centos7: [
    {
      Name: "name",
      Values: [
        "CentOS Linux 7*"
      ]
    },
    {
      Name: "owner-id",
      Values: [
        "679593333241"
      ]
    }
  ],
  rhel6: [
    {
      Name: "name",
      Values: [
        "RHEL-6*"
      ]
    },
    {
      Name: "owner-id",
      Values: [
        "309956199498"
      ]
    }
  ],
  rhel7: [{
    Name: "name",
    Values: [
      "RHEL-7*"
    ]
  },
  {
    Name: "owner-id",
    Values: [
      "309956199498"
    ]
  }
  ]
};

const defaultFilter = [
  {
    Name: "architecture",
    Values: ["x86_64"]
  },
  {
    Name: "state",
    Values: ["available"]
  }
];

/**
 * Get latest AMI ID of official image on AWS market place.
 * @param {string} os - Os name in all lower case.
 * @param {string} [region] - AWS region string.
 * @param {string} [accessKeyId] - Access key id for AWS.
 * @param {string} [secretAccessKey] - Secret access key for AWS.
 * @returns {object} - AMI info object
 * plese note region, accessKeyId and secretAccessKey is optional
 * you can specify these values by environment variable or AWS credentials profile file.
 */
async function getImage(os, region, accessKeyId, secretAccessKey) {
  //check arguments
  if (!osFilters[os]) {
    debug(`${os} is not supported`);
    const err = new Error("Invelid OS");
    err.os = os;
    err.region = region;
    return Promise.reject(err);
  }
  const Filters = defaultFilter.concat(osFilters[os]);

  //create EC2 object
  const awsConfig = {
    region,
    maxRetries: 100
  };
  if (typeof accessKeyId === "string") {
    awsConfig.accessKeyId = accessKeyId;
  }
  if (typeof secretAccessKey === "string") {
    awsConfig.secretAccessKey = secretAccessKey;
  }
  if (typeof region !== "string") {
    if ([].includes(region)) {
      awsConfig.region = region;
    } else {
      const err = new Error("Invelid region specified");
      err.os = os;
      err.region = region;
      return Promise.reject(err);
    }
  }
  const ec2 = new AWS.EC2(awsConfig);

  //actual query starts here
  debug("search AMI ID for ", os, "in", region);
  const rt = await ec2.describeImages({ ExecutableUsers: ["self", "all"], Filters }).promise();
  if (rt.Images.length === 0) {
    debug("OS image not found");
    const err = new Error("OS ImageId not found");
    err.os = os;
    err.region = region;
    err.filter = Filters;
    return Promise.reject(err);
  }
  debug("Candidates:", rt.Images.map((e)=>{
    return { date: e.CreationDate, ID: e.ImageId };
  }));

  //get latest image
  const latest = rt.Images
    .filter((e)=>{
      return e.CreationDate;
    })
    .reduce((a, c)=>{
      return c.CreationDate > a.CreationDate ? c : a;
    });
  debug("latest image:", latest);
  return latest;
}

module.exports = getImage;
