import prisma from 'src/lib/prisma'

export class CompanyRepository {
  async findByUser(userId: string) {
    return prisma.company.findMany({
      where: {
        users: {
          some: {
            userId
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  }

  async findById(id: string) {
    return prisma.company.findUnique({
      where: { id }
    })
  }
}
