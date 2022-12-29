const express = require('express')
const crypto = require('node:crypto')

const app = express()

app.use(express.json())

//In Memory Storage
const customers = []

/**
 * cpf: string
 * name: string
 * id: uuid
 * statement: [] (armazenara os extratos)
 */
app.post('/account', (req, res) => {
  const { cpf, name } = req.body
  const id = crypto.randomUUID()

  const customerAlredyExist = customers.some(customer => customer.cpf === cpf)

  if (customerAlredyExist) {
    return res.status(400).json({ error: 'Customer already exists' })
  }

  const customer = {
    id,
    name,
    cpf,
    statement: []
  }

  customers.push(customer)

  return res.status(201).json(customer)
})

app.get('/statement/:cpf', (req, res) => {
  const { cpf } = req.params

  const customer = customers.find(customer => customer.cpf === cpf)

  return res.json(customer.statement)
})

app.listen(3333)
