define all objects
create a page
- url
- name
- view
- data + action
- requires login?

ex:

list people
/people
```
    content
        ion-list
            ion-item(ng-repeat='person in people')
                h4
                    {{person.name}} / {{person.age}}
                p
                    {{person.description}}
```
$scope.people has an array: `[people]`
$scope.refresh() is a function that populates `[people]`. It is called the first time the view is entered.

view person
/people/:id
```
    content
        ion-list
            ion-item
                h4
                    {{person.name}} / {{person.age}}
                p
                    {{person.description}}
```
$scope.person has an object: `person`
$scope.refresh() is a function that gets `person` with id `:id`. It is called the first time the view is entered.

update person
/people/:id/update
```
    content
        ion-list
            ion-item
                input(ng-model="person.name")
            ion-item
                input(ng-model="person.age")
            ion-item
                textarea(ng-model="person.description")
            ion-item
                button.button.button-balanced(ng-click="update()")
```
$scope.person is initially the current state (set of properties) of the person.
$scope.update() is a function that updates `person`.

create person
/people/new
```
    content
        ion-list
            ion-item
                input(ng-model="person.name")
            ion-item
                input(ng-model="person.age")
            ion-item
                textarea(ng-model="person.description")
            ion-item
                button.button.button-balanced(ng-click="save()")
```
$scope.person models the person being created. It's an empty object at the beginning.
$scope.save() is a function that saves `person`.

