import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { UsersV1Moduel } from './v1/user-v1.module';
import { UsersV2Moduel } from './v2/user-v2.module';

@Module({
  imports: [
    UsersV1Moduel,
    UsersV2Moduel,

    // RouterModule.register([
    //   {
    //     path: 'v1',
    //     module: UsersV1Moduel
    //   },
    //   {
    //     path: 'v2',
    //     module: UsersV2Moduel
    //   }
    // ])
  ]
})
export class UsersModule { }

// @Module({
//   imports: [
//     UsersV1Moduel,
//     UsersV2Moduel,

//     RouterModule.register([
//       {
//         path: 'users',
//         children: [
//           {
//             path: 'v1',
//             module: UsersV1Moduel
//           },
//           {
//             path: 'v2',
//             module: UsersV2Moduel
//           }
//         ]
//       },

//     ])
//   ]
// })
// export class UsersModule { }

// @Module({
//   imports: [
//     UsersV1Moduel,
//     UsersV2Moduel,
//   ]
// })
// export class UsersModule { }