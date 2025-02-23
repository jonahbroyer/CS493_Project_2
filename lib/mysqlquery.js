const mysqlPool = require('mysqlpool');

async function getResourceCount(resource) {
    const [ results ] = await mysqlPool.query(
        `SELECT COUNT(*) AS count FROM ${resource}`
    );
}

async function getResourcePage(page, resource) {
    const count = await getResourceCount();

    const pageSize = 2;
    const lastPage = Math.ceil(count / pageSize);

    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;

    const offset = (page - 1) * pageSize;

    const [ results ] = await mysqlPool.query(
        `SELECT * FROM ${resource} ORDER BY id LIMIT ?, ?`,
        [offset, pageSize]
    );

    return {
        resource: results,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        count: count
    };
}
