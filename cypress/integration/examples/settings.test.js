/*
Cypress is an end-to-end test where developers can set up, write, running and debugging tests,
Cypress involves therefore testing an application’s workflow from beginning to end.
*/
describe('My settings page Test', () => {
    it('Visits the login page for any user', () => {
        cy.visit('http://sustaininator.eu/');
        cy.get('.action-register').click();
        cy.get('.action-login').click();

        // Get an email input, type into it and verify that the value has been updated
        //.should() describe the desired state of your elements, your objects, and your application
        cy.get('.action-email')
        .type('fake@email.com')
        .should('have.value', 'fake@email.com');
        
        // Get an password input, type into it and verify that the value has been updated
        cy.get('.action-password')
        .type('Ming#1359')
        .should('have.value', 'Ming#1359');
        cy.get('.action-submit').click();
        
        // When you login a test will be conducted to check if the user got a cookie.
        cy.getCookie('auth').should('have.property','value','608911a0070ea135f09e3705');

        // Enters the settings page and then enters new values
        cy.get('.action-menu').click();
        cy.get('.settings-button').click();

        cy.get('.first-name-text').click()
        .clear()
        .type('Fake')
        .should('have.value', 'Fake');

        cy.get('.last-name-text').click()
        .clear()
        .type('Fakesen')
        .should('have.value', 'Fakesen');

        // Invoke is a function on the previously yielded subject, then use that to be equal to the subject.
        cy.get('select').select(['EUR'])
        .invoke('val')
        .should('have.equal', 'EUR');
        
        cy.get('.update-user-settings').click();

        cy.get('.action-menu').click();
        cy.get('.settings-button').click();

        cy.get('.sustainability-choice')
        .clear()
        .type('46')
        .should('have.value', '46');

        cy.get('.update-sustainability-choice').click();

        cy.get('.home-button').click();
    });
});