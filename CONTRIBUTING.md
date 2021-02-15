## Git branch management

The project is developed internally at Knot and available publicly on Github so you can view the code and make contribution if you want to.

At Knot:
* We create a branch for a specific feature
* After completion and review the branch is merged into our `dev` branch
* After a while, or right after, it depends on the urgency of the feature, we merge on our `pre_prod` branch which publish the package on our private npm repository for us to test the package.
* If the package still works and the new features are ok, we merge on our `master` branch which deploy the package on npmjs.org
* This is directly followed by the mirroring of our `master` branch on the Github repository `master` branch

On Github
* When you want to make a contribution, you create a pull request targeting the `community` branch
* When reviewed and accepted the PR is merged into the `community` branch
* We then merge the `community` branch into our internal dev branch and follow the same steps described above
* The master branch is merged into the community branch when needed so it stays up to date