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

async function getPhotoById(photoID) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM photos WHERE id = ?',
    [ photoID ],
  );
  return results[0];
}

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', async (req, res, next) => {
  try {
    const photo = await
    getPhotoById(parseInt(req.params.id));
    if (photo) {
      res.status(200).send(photo);
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to fetch photo."
    });
  }
});

async function updatePhotoById(photoID, photo) {
  const validatedPhoto = extractValidFields(
    photo,
    photoSchema
  );
  const [ result ] = await mysqlPool.query(
    'UPDATE photos SET ? WHERE id = ?',
    [ validatedPhoto, photoID ]
  );
  return result.affectedRows > 0;
}

/*
 * Route to update a photo.
 */
router.put('/:photoID', async (req, res, next) => {
  if (validateAgainstSchema(req.body, photoSchema)) {
    try {
      const updateSuccessful = await
        updatePhotoById(parseInt(req.params.id), req.body);
      if (updateSuccessful) {
        res.status(200).send({
          links: {
            photo: `/photos/${photoID}`
          }
        });
      } else {
        next();
      }
    } catch (err) {
      res.status(500).send({
        error: "Unable to update photo."
      });
    }
  } else {
    res.status(400).json({
      error: "Request body does not contain a valid photo."
    });
  }
});

async function deletePhotoById(photoID) {
  const [ result ] = await mysqlPool.query(
    'DELETE FROM photos WHERE id = ?',
    [ photoID ]
  );
  return result.affectedRows > 0;
}

/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async (req, res, next) => {
  try {
    const deleteSuccessful = await
        deletePhotoById(parseInt(req.params.id));

    if (deleteSuccessful) {
            res.status(204).end();
    } else {
        next();
    }
} catch (err) {
    res.status(500).send({
        error: "Unable to delete photo."
    });
  }
});

async function getPhotosByUserId(userid) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM photos WHERE userid = ?',
    [ userid ],
  );
  return results[0];
}
