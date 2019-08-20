import { expect } from 'chai';
import './index';

describe('Main test', () => {
    it('sohuld have env variable set', () => {
        expect(process.env.APP_TEST_ENV).to.be.eql('helloWorldTest');
    });
});
