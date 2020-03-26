# How to contribute

We welcome participation in open project.  We want to make it as easy as
possible for people to work together, so please follow these guidelines to
prepare and submit a pull request.

## How to prepare

* You need a Github account. You can [create one](https://github.com/signup/free)
  for free.
* Submit an [Issue](https://github.com/tripleblindmarket/private-kit/issues) against
  the repo to describe the idea or problem if there is not one yet.
    * Describe a bug by including steps to reproduce and earliest version you
      know is affected.
    * Describe a new feature with as much detail as possible.
* Fork the repository on GitHub:
  - Visit https://github.com/tripleblindmarket/private-kit
  - Click on the "Fork" button in the upper-left corner.
* Clone the forked repository to your local machine:
   ```bash
   cd ~ # get to your home directory or where ever you want to go
   git clone https://github.com/YOURACCOUNT/
   ```
   (see also how to [fork a repo](https://help.github.com/articles/fork-a-repo/))

## Make Changes

  1. [Optional] Create a branch based on the `develop` branch.  Name the branch
     something to reflect what you are doing.  For example, if Steve Penrod
     wants to add a new icon a branch name you could do:
     ```bash
     git checkout develop # you want to branch from the main 'develop' branch
     git pull # make sure you have the latest code when you start the branch
     git checkout -b "spenrod/new-icon" develop # new branch created!
     ```
  2. Stick to the coding style and patterns that are used already.
  3. Document code!  Comments are good.  More comments are better.  :)
  4. Make commits as you desire.  Ultimately they will be squashed, so make
     notes to yourself.  It's as simple as `git commit`!
  5. Once you have committed everything and are done with this batch of work,
     push your changes back to your Github:
     ```bash
     git push
     ```
  6. Start a PR to submit your changes back to the original project:
     - Visit https://github.com/YOURACCOUNT/private-kit
     - Click on the 
      - Checkout the `develop` branch and make sure it is up-to-date.
      - Checkout your branch and rebase it against `develop`.
      - Resolve any conflicts locally.
      - Force your push since the historical base has changed.
      - Specific commands:
        ```
        git checkout develop
        git fetch
        git reset --hard origin/develop
        git checkout <your_branch_name>
        git rebase develop
        git push -f
        ```
  6. Finally [create a Pull Request (PR) on Github](https://help.github.com/articles/using-pull-requests/)
     for review and merging.

**Note**: Even if you have write access, do not work directly on `master` or
push directly to `develop`!  All work is done against `develop`, reviewed and
merged via PRs, and ultimately `develop` gets merged into `master` for tagged
code releases.

## Submit Changes

* Push your changes to a topic branch in your fork of the repository.
* Open a pull request to the original repository and choose the `develop`
    _Advanced users may install the `hub` gem and use the [`hub pull-request` command](https://github.com/defunkt/hub#git-pull-request)._
* If not done in commit messages (which you really should do), reference and
  update your issue with the code changes. But _please do not close the issue
  yourself_.
* A team member will review the pull request, request change or approve and
  merge into the `develop` branch.

## Reviewing Pull Requests

* Open the PR on Github. At the top of the PR page is a number which identifies it -123 and the name of the author's branch -branch-name. Copy down both of these.

* Open git bash and ensure your working directory is clean by running ```git status```

* Get a copy of the PR by typing ```git fetch upstream pull/<id>/head:<new local branch>```. In this example you would type git fetch upstream pull/123/head:branch-name

* Now that you have a copy of the branch, switch to it using ```git checkout branch-name```. Your directory will now be an exact copy of the PR. Be sure to tell the author about any bugs or suggestions, as you cannot add your own changes to a pull request directly.

* When you are done checking out their work, use ```git checkout master``` to return to your local version 

### Git Aliases to help with pull request reviews 

Aliases are shortcuts that you can define in git bash (or linux/mac) that reduces typing and minimizes errors. The following commands create two aliases, one for grabbing a PR and switching to that branch. The other one deletes the branch.

Copy/paste each line (one at a time) to gitbash or terminal window.

```git config --global --add alias.pr '!f() { git fetch -fu ${2:-upstream} refs/pull/$1/head:pr/$1 && git checkout pr/$1; }; f'```

and

```git config --global --add alias.pr-clean '!git checkout master ; git for-each-ref refs/heads/pr/* --format="%(refname)" | while read ref ; do branch=${ref#refs/heads/} ; git branch -D $branch ; done'```

Once created the aliases are used as shown below.
* To pull a pull request: ```git pr <id>``` to use the example above git pr 123
* To delete all the pull requests created locally: ```git pr-clean```

# Additional Resources

* [General GitHub documentation](http://help.github.com/)
* [GitHub pull request documentation](https://help.github.com/articles/about-pull-requests/)
* [Read the Issue Guidelines by @necolas](https://github.com/necolas/issue-guidelines/blob/master/CONTRIBUTING.md) for more details

