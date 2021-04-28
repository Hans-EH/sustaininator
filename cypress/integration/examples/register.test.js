describe('My Register Test', () => {
    it('Visits the Register page to sign up', () => {
        cy.visit('localhost:3000/register');
        cy.get('.action-login').click();

        cy.get('.action-register').click();

        cy.get('.action-first-name')
        .type('Test')
        .should('have.have', 'Test');

        cy.get('.action-last-name')
        .type('Testsen')
        .should('have.have', 'Testsen');

        // Get an email input, type into it and verify that the value has been updated
        cy.get('.action-email')
        .type('fake@email.com')
        .should('have.value', 'fake@email.com');
        
        // Get an password input, type into it and verify that the value has been updated
        cy.get('.action-password')
        .type('Ming#1359')
        .should('have.value', 'Ming#1359');

        cy.get('.action-confirm-password')
        .type('Ming#1359')
        .should('have.value', 'Ming#1359');

        cy.get('.submit-register').click();
    })
})
