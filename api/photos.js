const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const photos = require('../data/photos');

exports.router = router;
exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};

async function insertNewPhoto(photo) {
  const validatedPhoto = extractValidFields(
    photo,
    photoSchema
  );
  const [ result ] = await mysqlPool.query(
    'INSERT INTO photos SET ?',
    validatedPhoto
  );
  return result.insertId;
}

/*
 * Route to create a new photo.
 */
router.post('/', async (req, res, next) => {
  if (validateAgainstSchema(req.body, photoSchema)) {
    try {
      const id = await insertNewPhoto(req.body);
      res.status(201).send({
      id: id,
      links: { photo: `/photos/${id}`, business: `/businesses/${id}`} });
      } catch (err) {
        res.status(500).send({
        error: "Error inserting photo into DB."
      });
    }
  } else {
    res.status(400).json({
      error: "Request body is not a valid photo object"
    });
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  if (photos[photoID]) {
    res.status(200).json(photos[photoID]);
  } else {
    next();
  }
});

/*
 * Route to update a photo.
 */
router.put('/:photoID', function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  if (photos[photoID]) {

    if (validateAgainstSchema(req.body, photoSchema)) {
      /*
       * Make sure the updated photo has the same businessid and userid as
       * the existing photo.
       */
      const updatedPhoto = extractValidFields(req.body, photoSchema);
      const existingPhoto = photos[photoID];
      if (existingPhoto && updatedPhoto.businessid === existingPhoto.businessid && updatedPhoto.userid === existingPhoto.userid) {
        photos[photoID] = updatedPhoto;
        photos[photoID].id = photoID;
        res.status(200).json({
          links: {
            photo: `/photos/${photoID}`,
            business: `/businesses/${updatedPhoto.businessid}`
          }
        });
      } else {
        res.status(403).json({
          error: "Updated photo cannot modify businessid or userid"
        });
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid photo object"
      });
    }

  } else {
    next();
  }
});

/*
 * Route to delete a photo.
 */
router.delete('/:photoID', function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  if (photos[photoID]) {
    photos[photoID] = null;
    res.status(204).end();
  } else {
    next();
  }
});
