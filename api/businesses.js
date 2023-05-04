const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');

import { application } from "express";
import {getResourceCount, getResourcePage} from "./lib/mysqlquery.js"
import mysqlPool from "../lib/mysqlpool.js";

exports.router = router;
exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};

/*
 * Route to return a list of businesses.
 */
router.get('/', async (req, res) => {
  const count = getResourceCount(businesses);
  try {
    const businessesPage = await getResourcePage(parseInt(req.query.page) || 1, businesses);
    res.status(200).send(businessesPage);
  } catch (err) {
    res.status(500).json({
      error: "Error fetching lodgings list. Try again later."
    });
  }
});

async function insertNewBusiness(business) {
  const validatedBusiness = extractValidFields(
    business,
    businessSchema
  );
  const [ result ] = await mysqlPool.query(
    'INSERT INTO businesses SET ?',
    validatedBusiness
  );
  return result.insertId;
}

/*
 * Route to create a new business.
 */
router.post('/', async (req, res, next) => {
  if (validateAgainstSchema(req.body, businessSchema)) {
    try {
      const id = await insertNewBusiness(req.body);
      res.status(201).send({ id: id, links: {business: `/businesses/${id}`} });
    } catch (err) {
      res.status(500).send({
        error: "Error inserting business into DB."
      });
    }
  } else {
    res.status(400).json({
      error: "Request body is not a valid business object"
    });
  }
});

async function getBusinessesById(businessid) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM businesses WHERE id = ?',
    [ businessid ],
  );
  return results[0];
}

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async (req, res, next) => {
  try {
    const business = await
    getBusinessesById(parseInt(req.params.id));
    if (business) {
      res.status(200).send(business);
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to fetch business."
    });
  }
  // if (businesses[businessid]) {
  //   /*
  //    * Find all reviews and photos for the specified business and create a
  //    * new object containing all of the business data, including reviews and
  //    * photos.
  //    */
  //   const business = {
  //     reviews: reviews.filter(review => review && review.businessid === businessid),
  //     photos: photos.filter(photo => photo && photo.businessid === businessid)
  //   };
  //   Object.assign(business, businesses[businessid]);
  //   res.status(200).json(business);
  // } else {
  //   next();
  // }
});

/*
 * Route to replace data for a business.
 */
router.put('/:businessid', function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  if (businesses[businessid]) {

    if (validateAgainstSchema(req.body, businessSchema)) {
      businesses[businessid] = extractValidFields(req.body, businessSchema);
      businesses[businessid].id = businessid;
      res.status(200).json({
        links: {
          business: `/businesses/${businessid}`
        }
      });
    } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }

  } else {
    next();
  }
});

/*
 * Route to delete a business.
 */
router.delete('/:businessid', function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  if (businesses[businessid]) {
    businesses[businessid] = null;
    res.status(204).end();
  } else {
    next();
  }
});
