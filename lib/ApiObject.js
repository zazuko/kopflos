class ApiObject {
  constructor (api, iri) {
    this.api = api
    this.iri = iri
  }

  value (property, subject) {
    const term = this.valueTerm(property, subject)

    return term && term.value
  }

  valueTerm (property, subject) {
    subject = subject || this.iri

    return this.api.match(subject, property).toArray().map(t => t.object).shift()
  }
}

module.exports = ApiObject
