const express = require('express')
const crypto = require('node:crypto')

const app = express()

app.use(express.json())

//In Memory Storage
const customers = []

//Middleware
function verifyIfExistAccountCPF(req, res, next) {
  const { cpf } = req.headers

  if (customers.length === 0) {
    res.status(401).json({
      message: 'Account not found'
    })
  }

  const customer = customers.find(customer => customer.cpf === cpf)

  if (!customer) {
    res.status(401).json({
      message: 'Account not found'
    })
  }

  req.customer = customer

  return next()
}

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

//No comentário a abaixo é outra forma de se utilizar um middleware
//  nesse caso todas as rotas abaixo do middleware vai aciona-lo para executar suas responsabilidade

//app.use(verifyIfExistAccountCPF)

/**
 * Buscar Statement de cliente
 */
app.get('/statement', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req

  return res.json(customer.statement)
})

app.post('/deposit', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req
  const { description, amount } = req.body

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()
})

app.post('/withdraw', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req
  const { description, amount } = req.body

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()
})

app.listen(3333)
