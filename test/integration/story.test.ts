import {
  defineTestSuiteAndAddTests,
  runMochaTests,
} from '../helpers/story/test-config'
;(async () => {
  defineTestSuiteAndAddTests()

  try {
    const result = await runMochaTests()
    console.log(result)
  } catch (e) {
    console.log(e)
  }
})()

// const { runMochaTests } = require('./lib/mocha-setup');
// const { defineTestSuiteAndAddTests } = require('./programmatic/sample-tests');

// (async () => {

//     defineTestSuiteAndAddTests();

//     try {
//         const result = await runMochaTests()
//         console.log(result);
//     }
//     catch (e) { console.log(e) }
// })()

// describe.only('story test', async () => {
//   const allTestStories: Array<TestScenario> = generateStories()

//   console.log(
//     'Generating tests for the following stories:',
//     JSON.stringify(allTestStories)
//   )

//   var allGeneratedTests: Array<any> = []

//   for (let story of allTestStories) {
//     let newTests = generateTests(story)
//     allGeneratedTests = allGeneratedTests.concat(newTests)
//   }

//   // console.log('Generated tests:', JSON.stringify(allGeneratedTests))

//   let Suite = Mocha.Suite
//   var Test = Mocha.Test
//   var expect = Chai.expect

//   var mochaInstance = new Mocha()
//   var suiteInstance = Mocha.Suite.create(
//     mochaInstance.suite,
//     'Story Test Suite'
//   )

//   for (let test of allGeneratedTests) {
//     suiteInstance.addTest(test)
//   }

//   console.log({suiteInstance})
//   //is this needed ?
//   /*before(async () => {
//     await updatePlatformSetting(
//       {
//         name: 'RequiredSubmissionsPercentage',
//         value: 100,
//       },
//       hre
//     )
//   })*/

//   //run all of the generated story tests (they are async)
//   var suiteRun = mochaInstance.run()
// })
