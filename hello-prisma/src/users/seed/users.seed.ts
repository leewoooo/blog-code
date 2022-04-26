import { PrismaClient, Prisma } from '@prisma/client'

// typescript 파일을 node로 실행시킬 때는 ts-node 명령어가 있어야 한다.
// yarn add ts-node -D
// yarn ts-node *.ts || npx ts-node *.ts
// TODO: npx에 대해 개념 이해하기

// prisma db seed 명령어를 이용하려면 package.json에 seed파일 경로를 설정해야 한다. 또한 migration할 때 자동으로 실행됨.
// prisma db seed를 이용하지 않고 ts파일을 실행시키고자 한다면 아래와 같은 코드를 작성 후 ts-node를 이용하여 실행시키면 된다.
const prisma = new PrismaClient()
const userData: Prisma.UserCreateInput[] = [
  {
    name: 'Alice',
    email: 'alice@prisma.io',
    posts: {
      create: [
        {
          title: 'Join the Prisma Slack',
          content: 'https://slack.prisma.io',
          published: true,
        },
      ],
    },
  },
  {
    name: 'Nilu',
    email: 'nilu@prisma.io',
    posts: {
      create: [
        {
          title: 'Follow Prisma on Twitter',
          content: 'https://www.twitter.com/prisma',
          published: true,
        },
      ],
    },
  },
  {
    name: 'Mahmoud',
    email: 'mahmoud@prisma.io',
    posts: {
      create: [
        {
          title: 'Ask a question about Prisma on GitHub',
          content: 'https://www.github.com/prisma/prisma/discussions',
          published: true,
        },
        {
          title: 'Prisma on YouTube',
          content: 'https://pris.ly/youtube',
        },
      ],
    },
  },
]

async function main() {
  console.log(`Start seeding ...`)
  for (const u of userData) {
    const user = await prisma.user.create({
      data: u,
    })
    console.log(`Created user with id: ${user.id}`)
  }
  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })