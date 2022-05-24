class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let queryObject = { ...this.queryString };
    const fieldsToExclude = ['page', 'sort', 'fields', 'limit'];
    fieldsToExclude.forEach((element) => delete queryObject[element]);
    const queryString = JSON.stringify(queryObject);
    queryObject = JSON.parse(
      queryString.replace(/\b(gte | gt | lte | lt)\b/g, (match) => `$${match}`)
    );

    this.query = this.query.find(queryObject);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitToFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    const page = Number(this.queryString.page) || 1;
    const limitTo = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limitTo;
    this.query = this.query.skip(skip).limit(limitTo);
    return this;
  }
}

module.exports = APIFeatures;
