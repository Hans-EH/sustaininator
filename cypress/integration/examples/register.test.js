/*
Cypress is an end-to-end test where developers can set up, write, running and debugging tests,
Cypress involves therefore testing an application’s workflow from beginning to end. 
*/
describe('My Register Test', () => {
    it('Visits the Register page to sign up', () => {
        cy.visit('localhost:3000/register');
        cy.get('.action-login').click();
        cy.get('.action-register').click();

        // Get an first and last name input
        cy.get('.action-first-name')
        .type('Test')
        .should('have.have', 'Test');

        cy.get('.action-last-name')
        .type('Testsen')
        .should('have.have', 'Testsen');

        // Get an email input
        cy.get('.action-email')
        .type('fake@email.com')
        .should('have.value', 'fake@email.com');
        
        // Get an password input
        cy.get('.action-password')
        .type('Ming#1359')
        .should('have.value', 'Ming#1359');

        cy.get('.action-confirm-password')
        .type('Ming#1359')
        .should('have.value', 'Ming#1359');

        cy.get('.submit-register').click();
    })
})
