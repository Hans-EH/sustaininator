/*
Cypress is an end-to-end test where developers can set up, write, running and debugging tests,
Cypress involves therefore testing an application’s workflow from beginning to end.
*/
describe('My logout test', () => {
    it('Visits the login page for any user', () => {
        cy.visit('http://130.226.98.69:3000/login');
        cy.get('.action-register').click();
        cy.get('.action-login').click();

        // Get an email input
        cy.get('.action-email')
        .type('fake@email.com')
        .should('have.value', 'fake@email.com');
        
        // Get an password input
        cy.get('.action-password')
        .type('Ming#1359')
        .should('have.value', 'Ming#1359');
        cy.get('.action-submit').click();
        
        // When you login a test will be conducted to check if the user got a cookie.
        cy.getCookie('auth').should('have.property','value','60acf473a59f68158d97b64d');
        cy.wait(6000);

        cy.get('.action-menu').click();
        cy.get('.logout-button').click();
    });
});